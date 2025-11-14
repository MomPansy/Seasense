import { anthropic } from "@ai-sdk/anthropic";
import {
  Experimental_Agent as Agent,
  extractReasoningMiddleware,
  Experimental_InferAgentUIMessage as InferAgentUIMessage,
  stepCountIs,
  tool,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import { readOnlyDb } from "server/lib/db.ts";
import vessel_arrivals_schema from "server/vessel_arrivals.description.json";
import vessel_departures_schema from "server/vessel_departures.description.json";
import vessels_schema from "server/vessels.description.json";
import vessels_due_to_arrive_schema from "server/vessels_due_to_arrive.description.json";

const webSearchTool = anthropic.tools.webSearch_20250305({
  maxUses: 5,
});

const webFetchTool = anthropic.tools.webFetch_20250910({ maxUses: 5 });

const databaseQueryAgent = new Agent({
  model: wrapLanguageModel({
    model: anthropic("claude-opus-4-20250514"),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  }),
  system: `
    You are a database query agent that helps users retrieve information from a 
    database by generating SQL queries based on user questions. 
    Use the provided tool to execute SQL queries and return the results to the user. If the user query requires information not present in the database, 
    you may use the web search tool to gather additional information. If you require positional information you can access 
    1. https://www.vesselfinder.com/vessels/details/:MMSI 
      to fetch the relevant details, but note that this is MMSI instead of IMO.
    2. https://shipinfo.net/, here is an example endpoint https://shipinfo.net/find_vessel_Seven-Seas_IMO-9384760_MMSI-235060176

    There are 2 main datasets available:
    (1) IHS Dataset ("vessels" table):
      - This contains vessel details that we know about. We use this as our source of truth for vessel details. The detailed database schema for the vessels table: ${JSON.stringify(vessels_schema)}
    (2) MDH Dataset ("vessels_due_to_arrive", "vessel_arrivals", and "vessel_departures" tables):
      - These contain data ingested from MDH APIs.
      - "vessels_due_to_arrive" contains information about what vessels are expected to arrive in Singapore (based on Pre-Arrival Notifications submitted to the Maritime and Port Authority of Singapore). The detailed database schema: ${JSON.stringify(vessels_due_to_arrive_schema)}
      - "vessel_arrivals" contains information about the vessels that have physically arrived into Singapore waters. The detailed database schema: ${JSON.stringify(vessel_arrivals_schema)}
      - "vessel_departures" contains information about the vessels that have physically left Singapore waters. The detailed database schema: ${JSON.stringify(vessel_departures_schema)}
    
    Note the following:
      - The following vessels are of interest to us:
        + IMO in MDH is "0" (means IMO is unknown).
        + IMO in MDH maps to ShipStatus in IHS showing the vessel is not currently in service/commission. 
        + IMO in MDH with vessel names that are dissimilar in IHS.
      - There may be mismatches between IHS and MDH datasets. Spell out the difference for easy reference if a question asks about the specifics of vessels.
    Query relevant tables above to answer questions. The columns are case sensitive, so add quotation marks for the column names; e.g. vessels."ShipName"

    You can only Read the database. You are NOT to perform any Create, Update, or Delete operations on the database; absolutely reject all requests for such operations.

    If a question is not detailed enough for you to fully understand the specific question to answer, or if there are ambiguities, prompt the user for more details before executing queries.
    
    Present your answer in a well-formatted way that is easy to read.
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
        const result = await readOnlyDb.execute(sqlQuery);
        return result;
      },
    }),
    web_search: webSearchTool,
    web_fetch: webFetchTool,
  },
});

type DatabaseQueryAgentType = InferAgentUIMessage<typeof databaseQueryAgent>;

export { databaseQueryAgent };
export type { DatabaseQueryAgentType };
