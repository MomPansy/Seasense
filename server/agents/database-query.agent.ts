import { anthropic } from "@ai-sdk/anthropic";
import {
  Experimental_Agent as Agent,
  extractReasoningMiddleware,
  Experimental_InferAgentUIMessage as InferAgentUIMessage,
  stepCountIs,
  tool,
  wrapLanguageModel,
  type AssistantContent,
} from "ai";
import { z } from "zod";
import {
  messages as messagesTable,
  type ToolInteraction,
} from "server/drizzle/messages.ts";
import { db, type Tx } from "server/lib/db.ts";
import vessel_arrivals_schema from "../vessel_arrivals.description.json" assert { type: "json" };
import vessel_departures_schema from "../vessel_departures.description.json" assert { type: "json" };
import vessels_schema from "../vessels.description.json" assert { type: "json" };
import vessels_due_to_arrive_schema from "../vessels_due_to_arrive.description.json" assert { type: "json" };

const databaseQueryAgent = new Agent({
  model: wrapLanguageModel({
    model: anthropic("claude-sonnet-4-0"),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  }),
  system: `
    You are a database query agent that helps users retrieve information from a 
    database by generating SQL queries based on user questions. 
    Use the provided tool to execute SQL queries and return the results to the user. 

    There are 2 main datasets available:
    (1) IHS Dataset ("vessels" table):
      - This contains vessel details that we know about. We use this as our source of truth for vessel details. The detailed database schema for the vessels table: ${JSON.stringify(vessels_schema)}
    (2) MDH Dataset ("vessels_due_to_arrive", "vessel_arrivals", and "vessel_departures" tables):
      - These contain data ingested from MDH APIs.
      - "vessels_due_to_arrive" contains information about what vessels are expected to arrive in Singapore (based on Pre-Arrival Notifications submitted to the Maritime and Port Authority of Singapore). The detailed database schema: ${JSON.stringify(vessels_due_to_arrive_schema)}
      - "vessel_arrivals" contains information about the vessels that have physically arrived into Singapore waters. The detailed database schema: ${JSON.stringify(vessel_arrivals_schema)}
      - "vessel_departures" contains information about the vessels that have physically left Singapore waters. The detailed database schema: ${JSON.stringify(vessel_departures_schema)}
    
    Note that the vessel details specified in the MDH Dataset and the IHS Dataset may not match. If a question asks about the specifics of vessels and the question or your answer involves the vessel details, point out mismatches or failed matches between the IHS and MDH datasets.

    You are to query the relevant tables above to answer questions. The column are case sensitive, so you need to add quotation marks for the column names. Example: vessels."ShipName"

    If a question is not detailed enough for you to fully understand the specific question to answer, or if there are ambiguities, prompt the user for more details before executing queries.
    
    After executing a query, provide a clear summary of the results including:
    - The number of records found
    - Key findings or patterns
    - A well-formatted presentation of the data
  `,
  stopWhen: stepCountIs(20),
  onStepFinish: ({ toolCalls, toolResults, text }) => {
    console.info("=== Step Finished ===");
    if (text) {
      console.info("Text:", text);
    }

    toolCalls.forEach((call, index) => {
      console.info(`Tool Call ${index + 1}:`, {
        toolName: call.toolName,
        toolCallId: call.toolCallId,
        input: "input" in call ? call.input : undefined,
      });
      if (toolResults[index]) {
        console.info(`Tool Result ${index + 1}:`, {
          toolName: toolResults[index].toolName,
          toolCallId: toolResults[index].toolCallId,
          output:
            "output" in toolResults[index]
              ? toolResults[index].output
              : undefined,
        });
      }
    });
  },
  tools: {
    queryDatabase: tool({
      description:
        "Executes a SQL query against the vessels database and returns the results.",
      inputSchema: z.object({
        sqlQuery: z
          .string()
          .describe("The SQL query to execute against the vessels database."),
      }),
      execute: async ({ sqlQuery }) => {
        // Execute the SQL query against the database
        const result = await db.execute(sqlQuery);
        return result;
      },
    }),
  },
});

// Helper function to save agent response to database
export async function saveAgentResponse({
  tx,
  chatId,
  messagePosition,
  result,
}: {
  tx: Tx;
  chatId: string;
  messagePosition: number;
  result: Awaited<ReturnType<typeof databaseQueryAgent.stream>>;
}) {
  const fullText = await result.text;
  const steps = await result.steps;

  // Build assistant content with text and reasoning
  const assistantContent: AssistantContent = [];

  // Build tool interaction data in the format: { text, toolCalls, toolResults }
  const toolInteraction: ToolInteraction = {
    text: fullText,
    toolCalls: [],
    toolResults: [],
  };

  // Add text response to assistant content
  if (fullText) {
    assistantContent.push({ type: "text", text: fullText });
  }

  // Collect tool calls and results from all steps
  for (const step of steps) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (step.toolCalls && step.toolCalls.length > 0) {
      for (const toolCall of step.toolCalls) {
        // Add to assistant content for context
        assistantContent.push({
          type: "tool-call",
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          input: "input" in toolCall ? toolCall.input : undefined,
        });

        // Add to tool interaction
        toolInteraction.toolCalls?.push({
          toolName: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          input: "input" in toolCall ? toolCall.input : undefined,
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (step.toolResults && step.toolResults.length > 0) {
      for (const toolResult of step.toolResults) {
        const output = "output" in toolResult ? toolResult.output : undefined;
        // Add to assistant content
        assistantContent.push({
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
          // @ts-expect-error - output type mismatch between agent result and AssistantContent
          output,
        });

        // Add to tool interaction
        toolInteraction.toolResults?.push({
          toolName: toolResult.toolName,
          toolCallId: toolResult.toolCallId,
          output,
        });
      }
    }
  }

  // Save assistant message with tool calls
  await tx.insert(messagesTable).values({
    chatId: chatId,
    role: "assistant",
    content: fullText,
    assistantContent:
      assistantContent.length > 0 ? assistantContent : undefined,
    toolContent: toolInteraction,
    position: messagePosition,
  });

  console.info("Agent response saved to database");
}

type DatabaseQueryAgent = InferAgentUIMessage<typeof databaseQueryAgent>;

export { databaseQueryAgent, type DatabaseQueryAgent };
