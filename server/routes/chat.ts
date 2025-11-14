import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  generateObject,
  type UserModelMessage,
  type AssistantModelMessage,
  type UIMessage,
  type ModelMessage,
  convertToModelMessages,
} from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { databaseQueryAgent } from "server/agents/database-query.agent.ts";
import { chats } from "server/drizzle/chats.ts";
import { messages as messagesTable } from "server/drizzle/messages.ts";
import { factory } from "server/factory.ts";
import { type Tx } from "server/lib/db.ts";
import { requireAuth } from "server/middlewares/clerk.ts";
import { drizzle } from "server/middlewares/drizzle.ts";
import { validateMessages } from "server/middlewares/validate-messages.ts";
import {
  ensureChatExists,
  handleChatTitleGeneration,
} from "server/utilities/chat.utils.ts";

async function insertUserMessage({
  tx,
  chatId,
  message,
  uiMessage,
  position,
}: {
  tx: Tx;
  chatId: string;
  message: UserModelMessage;
  uiMessage: UIMessage;
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
    content: textContent,
    uiMessage: uiMessage,
    position: position,
  });
}

async function insertAssistantMessage({
  tx,
  chatId,
  uiMessage,
  position,
  text,
}: {
  tx: Tx;
  chatId: string;
  text: string;
  message?: AssistantModelMessage;
  uiMessage?: UIMessage;
  position: number;
}) {
  await tx.insert(messagesTable).values({
    chatId: chatId,
    role: "assistant",
    content: text,
    uiMessage: uiMessage,
    position: position,
  });
}

function generalAssistant({
  modelMessages,
}: {
  modelMessages: ModelMessage[];
}) {
  return streamText({
    messages: modelMessages,
    model: anthropic("claude-3-5-haiku-20241022"),
  });
}

export const route = factory
  .createApp()
  // Require authentication for all chat routes
  .use("/*", requireAuth)
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

    // Return the stored UIMessages directly
    const uiMessages = chatMessages.map((msg) => msg.uiMessage).filter(Boolean);

    return c.json(uiMessages as UIMessage[]);
  })
  .post("/", validateMessages(), drizzle(), async (c) => {
    // Get validated messages from context
    const validatedMessages = c.var.validatedMessages;
    const chatId = c.var.chatId;
    const tx = c.var.tx;
    const modelMessages = convertToModelMessages(validatedMessages);
    const lastMessageIndex = modelMessages.length - 1;
    const lastMessage = modelMessages[lastMessageIndex] as UserModelMessage;

    const messageText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : lastMessage.content
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" ");

    await ensureChatExists(tx, chatId);

    const {
      object: { useAgent },
    } = await generateObject({
      model: anthropic("claude-3-5-haiku-20241022"),
      schema: z.object({ useAgent: z.boolean() }),
      prompt: messageText,
      system:
        'Decide if the question requires database access. Return {"useAgent": true} for database queries, {"useAgent": false} otherwise.',
    });

    // Get the UIMessage for the last (user) message
    const lastUIMessage = validatedMessages[lastMessageIndex];

    // Insert user message with UIMessage
    await insertUserMessage({
      tx,
      chatId,
      message: lastMessage,
      uiMessage: lastUIMessage,
      position: lastMessageIndex,
    });

    const result = useAgent
      ? databaseQueryAgent.stream({ messages: modelMessages })
      : generalAssistant({ modelMessages });

    return result.toUIMessageStreamResponse({
      messageMetadata: async ({ part }: { part: { type: string } }) => {
        if (part.type === "start") {
          return await handleChatTitleGeneration(tx, chatId, messageText);
        }
      },
      sendSources: true,
      onFinish: async ({ responseMessage }) => {
        // The responseMessage is the assistant response UIMessage
        const assistantUIMessage = responseMessage;

        if (assistantUIMessage.role === "assistant") {
          // Extract text content from the UIMessage
          const textContent = assistantUIMessage.parts
            .filter((part) => part.type === "text")
            .map((part) => (part as { type: "text"; text: string }).text)
            .join(" ");

          // Save the assistant message with the UIMessage
          await insertAssistantMessage({
            tx,
            chatId,
            text: textContent || (await result.text),
            uiMessage: assistantUIMessage,
            position: lastMessageIndex + 1,
          });
        }
      },
    });
  });
