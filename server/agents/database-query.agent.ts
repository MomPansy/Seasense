import { anthropic } from "@ai-sdk/anthropic";
import {
  Experimental_Agent as Agent,
  extractReasoningMiddleware,
  stepCountIs,
  tool,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import { db } from "server/lib/db.ts";
import vessels_schema from "../vessels.description.json" assert { type: "json" };

export const databaseQueryAgent = new Agent({
  model: wrapLanguageModel({
    model: anthropic("claude-sonnet-4-0"),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  }),
  system: `
    You are a database query agent that helps users retrieve information from a 
    database by generating SQL queries based on user questions. 
    Use the provided tool to execute SQL queries and return the results to the user. 
    Detailed database schema: ${JSON.stringify(vessels_schema)}

    You are to query the "vessels" table. The column are case sensitive, so you need to add quotation marks for the column names. Example: vessels."ShipName" 
    
    After executing a query, provide a clear summary of the results including:
    - The number of records found
    - Key findings or patterns
    - A well-formatted presentation of the data
  `,
  stopWhen: stepCountIs(20),
  onStepFinish: ({ toolCalls, toolResults }) => {
    console.info("=== Step Finished ===");
    toolCalls.forEach((call, index) => {
      console.info(`Tool Call ${index + 1}:`, call);
      console.info(`Tool Result ${index + 1}:`, toolResults[index]);
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
