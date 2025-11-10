import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import {
  streamText,
  generateObject,
  type UserModelMessage,
  type AssistantModelMessage,
  type AssistantContent,
  type UserContent,
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
  // Extract plain text content for the content column
  let textContent: string | undefined;
  if (typeof message.content === "string") {
    textContent = message.content;
  } else {
    // Extract text from array of parts
    textContent = message.content
      .filter((part) => part.type === "text")
      .map((part) => (part as { type: "text"; text: string }).text)
      .join(" ");
  }

  // Insert the user message with both plain text and structured content
  await tx.insert(messagesTable).values({
    chatId: chatId,
    role: message.role,
    content: textContent || undefined,
    userContent:
      typeof message.content === "string" ? undefined : message.content,
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
    content: text,
    assistantContent:
      message?.content && typeof message.content !== "string"
        ? message.content
        : undefined,
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
  .get("/:id/messages", drizzle(), async (c) => {
    const chatId = c.req.param("id");
    const tx = c.var.tx;

    // Fetch all messages for this chat
    const chatMessages = await tx
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chatId))
      .orderBy(messagesTable.position);

    // Convert database messages to ChatUIMessage format
    const uiMessages: ChatUIMessage[] = chatMessages.map((msg) => {
      // Extract the array element types from UserContent and AssistantContent
      // UserContent = string | Array<TextPart | ImagePart | FilePart>
      // AssistantContent = string | Array<TextPart | FilePart | ReasoningPart | ToolCallPart | ToolResultPart>
      type UserPart =
        Exclude<UserContent, string> extends (infer P)[] ? P : never;
      type AssistantPart =
        Exclude<AssistantContent, string> extends (infer P)[] ? P : never;
      type MessagePart = UserPart | AssistantPart;

      const parts: MessagePart[] = [];

      if (msg.role === "user") {
        if (msg.userContent) {
          if (Array.isArray(msg.userContent)) {
            parts.push(...msg.userContent);
          } else if (typeof msg.userContent === "string") {
            parts.push({ type: "text", text: msg.userContent });
          } else {
            parts.push(msg.userContent);
          }
        } else if (msg.content) {
          parts.push({ type: "text", text: msg.content });
        }
      } else if (msg.role === "assistant") {
        if (msg.assistantContent) {
          if (Array.isArray(msg.assistantContent)) {
            parts.push(...msg.assistantContent);
          } else if (typeof msg.assistantContent === "string") {
            parts.push({ type: "text", text: msg.assistantContent });
          } else {
            parts.push(msg.assistantContent);
          }
        } else if (msg.content) {
          parts.push({ type: "text", text: msg.content });
        }
      }

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        parts,
        createdAt: msg.createdAt,
      } as ChatUIMessage;
    });

    return c.json(uiMessages);
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
  );
