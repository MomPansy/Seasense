import { anthropic } from "@ai-sdk/anthropic";
import {
  AssistantModelMessage,
  convertToModelMessages,
  generateObject,
  ModelMessage,
  streamText,
  UserModelMessage,
} from "ai";
import { z } from "zod";
import { databaseQueryAgent } from "server/agents/database-query.agent.ts";
import { messages as messagesTable } from "server/drizzle/messages.ts";
import { factory } from "server/factory.ts";
import { Tx } from "server/lib/db.ts";
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
    content: textContent,
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

function generalAssistant({
  modelMessages,
  lastMessageIndex,
  tx,
  chatId,
}: {
  modelMessages: ModelMessage[];
  lastMessageIndex: number;
  tx: Tx;
  chatId: string;
}) {
  return streamText({
    messages: modelMessages,
    model: anthropic("claude-3-5-haiku-20241022"),
    onFinish: async (result) => {
      await insertAssistantMessage({
        tx,
        chatId,
        text: result.text,
        position: lastMessageIndex + 1,
      });
    },
  });
}

export const route = factory
  .createApp()
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

    // Insert user message
    await insertUserMessage({
      tx,
      chatId,
      message: lastMessage,
      position: lastMessageIndex,
    });

    const result = useAgent
      ? databaseQueryAgent.stream({ messages: modelMessages })
      : generalAssistant({ modelMessages, lastMessageIndex, tx, chatId });

    return result.toUIMessageStreamResponse({
      messageMetadata: async ({ part }) => {
        if (part.type === "start") {
          return await handleChatTitleGeneration(tx, chatId, messageText);
        }

        if (part.type === "finish" && useAgent) {
          const fullText = await result.text;
          await insertAssistantMessage({
            tx,
            chatId,
            text: fullText,
            position: lastMessageIndex + 1,
          });
        }
      },
    });
  });
