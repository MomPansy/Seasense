import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import {
  streamText,
  generateObject,
  type UserModelMessage,
  type AssistantModelMessage,
  convertToModelMessages,
} from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { chats } from "server/drizzle/chats.ts";
import { messages as messagesTable } from "server/drizzle/messages.ts";
import { factory } from "server/factory.ts";
import { type Tx } from "server/lib/db.ts";
import { drizzle } from "server/middlewares/drizzle.ts";
import { type ChatUIMessage } from "server/types/chat.ts";

// Define a flexible Zod schema for UIMessage validation
// This schema validates the structure while allowing for all UIMessage part types
const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(
    z
      .object({
        type: z.string(),
      })
      .catchall(z.unknown()),
  ),
  createdAt: z.date().optional(),
  metadata: z.unknown().optional(),
});

async function insertUserMessage({
  tx,
  chatId,
  message,
  position,
}: {
  tx: Tx;
  chatId: string;
  message: UserModelMessage;
  position: number;
}) {
  // Just insert the user message - title generation will happen during streaming
  await tx.insert(messagesTable).values({
    chatId: chatId,
    role: message.role,
    content: typeof message.content === "string" ? message.content : undefined,
    position: position,
  });
}

async function insertAssistantMessage({
  tx,
  chatId,
  message,
  position,
  text,
}: {
  tx: Tx;
  chatId: string;
  text: string;
  message?: AssistantModelMessage;
  position: number;
}) {
  await tx.insert(messagesTable).values({
    chatId: chatId,
    role: "assistant",
    content:
      text ||
      (message && typeof message.content === "string"
        ? message.content
        : undefined),
    assistantContent: message?.content,
    position: position,
  });
}

export const route = factory
  .createApp()
  .get("/", drizzle(), async (c) => {
    const tx = c.var.tx;

    // Fetch all chats ordered by most recent
    const allChats = await tx
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .orderBy(sql`updated_at desc`);

    return c.json(allChats);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        id: z.string(),
        messages: z.array(uiMessageSchema),
      }),
    ),
    drizzle(),
    async (c) => {
      // Step 1: Extract and validate request data
      const { id: chatId, messages } = c.req.valid("json");
      const { tx } = c.var;

      // Convert ChatUIMessages to ModelMessages
      // The validated messages match the ChatUIMessage structure
      const modelMessages = convertToModelMessages(messages as ChatUIMessage[]);

      const lastMessageIndex = modelMessages.length - 1;
      // Get the last message (should be from user)
      const lastMessage = modelMessages[lastMessageIndex] as UserModelMessage;

      // Ensure chat exists in database before inserting messages
      const existingChats = await tx
        .selectDistinct({
          id: chats.id,
          title: chats.title,
        })
        .from(chats)
        .where(eq(chats.id, chatId));

      if (existingChats.length === 0) {
        // Create chat entry with placeholder title
        await tx.insert(chats).values({
          id: chatId,
          title: "New Chat", // Placeholder, will be updated during streaming
        });
      }

      // insert user message into database
      await insertUserMessage({
        tx,
        chatId,
        message: lastMessage,
        position: lastMessageIndex,
      });

      const result = streamText({
        messages: modelMessages,
        model: anthropic("claude-3-5-haiku-20241022"),
        onFinish: async (result) => {
          // Insert assistant message into the database
          await insertAssistantMessage({
            tx: tx,
            chatId: chatId,
            text: result.text,
            position: lastMessageIndex + 1,
          });
        },
      });

      return result.toUIMessageStreamResponse({
        messageMetadata: async ({ part }) => {
          // When streaming starts, generate and update title for new chats
          if (part.type === "start") {
            const currentChat = await tx
              .selectDistinct({
                id: chats.id,
                title: chats.title,
              })
              .from(chats)
              .where(eq(chats.id, chatId));

            // Only generate title if it's still the placeholder
            if (currentChat.length > 0 && currentChat[0].title === "New Chat") {
              // Generate title for new chat
              const messageText =
                typeof lastMessage.content === "string"
                  ? lastMessage.content
                  : lastMessage.content
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join(" ");

              const titleResult = await generateObject({
                model: anthropic("claude-3-5-haiku-20241022"),
                prompt: "Generate a title for the chat: " + messageText,
                schema: z.object({
                  title: z.string(),
                }),
              });

              // Update chat with generated title
              await tx
                .update(chats)
                .set({ title: titleResult.object.title })
                .where(eq(chats.id, chatId));

              return {
                chatTitle: titleResult.object.title,
                isNewChat: true,
              };
            } else if (currentChat.length > 0) {
              return {
                chatTitle: currentChat[0].title,
                isNewChat: false,
              };
            }
          }
        },
      });
    },
  )
  .get(
    "/:chatId",
    zValidator(
      "param",
      z.object({
        chatId: z.string(),
      }),
    ),
    drizzle(),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const tx = c.var.tx;

      // Fetch messages from the database
      const messages = await tx
        .select({
          id: messagesTable.id,
          createdAt: messagesTable.createdAt,
          role: messagesTable.role,
          content: messagesTable.content,
          userContent: messagesTable.userContent,
          assistantContent: messagesTable.assistantContent,
          toolContent: messagesTable.toolContent,
        })
        .from(messagesTable)
        .where(eq(messagesTable.chatId, chatId))
        .orderBy(sql`position asc`);

      // convert to ChatUIMessage
      const uimessage: ChatUIMessage[] = messages.map((message) => {
        const { id, role, content } = message;
        const convertedMessage: ChatUIMessage = {
          id: id,
          role: role === "data" ? "assistant" : role,
          parts: [
            {
              type: "text",
              text: content ?? "",
            },
          ],
          metadata: {},
        };
        return convertedMessage;
      });

      return c.json(uimessage);
    },
  );
