import { UIMessage, validateUIMessages } from "ai";
import { type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import * as z from "zod";

export interface ValidatedMessagesVariables {
  validatedMessages: UIMessage[];
  chatId: string;
}

interface Options {
  /**
   * Optional metadata schema to validate message metadata
   */
  metadataSchema?: z.ZodType;

  /**
   * Optional data schemas to validate custom data parts
   */
  dataSchemas?: Record<string, z.ZodType>;

  /**
   * Optional tools to validate tool call parts
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: Record<string, any> | undefined;
}

/**
 * Middleware to validate UI messages using AI SDK's validateUIMessages
 *
 * This middleware:
 * 1. Extracts messages from the request body
 * 2. Validates them against schemas for metadata, data parts, and tools
 * 3. Sets validated messages in context for downstream use
 * 4. Throws HTTPException if validation fails
 *
 * @example
 * ```typescript
 * app.post('/chat',
 *   validateMessages({
 *     metadataSchema: z.object({
 *       chatTitle: z.string().optional(),
 *       isNewChat: z.boolean().optional(),
 *     })
 *   }),
 *   async (c) => {
 *     const messages = c.get('validatedMessages');
 *     // Use validated messages...
 *   }
 * )
 * ```
 */
export function validateMessages(
  options: Options = {},
): MiddlewareHandler<{ Variables: ValidatedMessagesVariables }> {
  return createMiddleware<{ Variables: ValidatedMessagesVariables }>(
    async (c, next) => {
      try {
        // Get messages from request body
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body = await c.req.json();

        // Validate and narrow the types
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!body.messages) {
          throw new HTTPException(400, {
            res: Response.json(
              { error: "messages field is required in request body" },
              { status: 400 },
            ),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!Array.isArray(body.messages)) {
          throw new HTTPException(400, {
            res: Response.json(
              { error: "messages must be an array" },
              { status: 400 },
            ),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!body.id || typeof body.id !== "string") {
          throw new HTTPException(400, {
            res: Response.json(
              { error: "id field is required in request body" },
              { status: 400 },
            ),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const messages = body.messages;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const id = body.id;

        // Validate messages using AI SDK
        const validatedMessages = await validateUIMessages({
          messages,
          metadataSchema: options.metadataSchema,
          dataSchemas: options.dataSchemas,

          tools: options.tools,
        });

        // Set validated messages in context
        c.set("validatedMessages", validatedMessages);

        // Set chat ID
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        c.set("chatId", id);

        await next();
      } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
          throw new HTTPException(400, {
            res: Response.json(
              {
                error: "Invalid message format",
                details: error.errors,
              },
              { status: 400 },
            ),
          });
        }

        // Re-throw HTTP exceptions
        if (error instanceof HTTPException) {
          throw error;
        }

        // Handle unknown errors
        console.error("Message validation error:", error);
        throw new HTTPException(500, {
          res: Response.json(
            { error: "Internal server error during message validation" },
            { status: 500 },
          ),
        });
      }
    },
  );
}
