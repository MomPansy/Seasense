import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { chats } from "server/drizzle/chats.ts";
import { Tx } from "server/lib/db.ts";

export async function ensureChatExists(tx: Tx, chatId: string) {
  const existingChats = await tx
    .selectDistinct({ id: chats.id })
    .from(chats)
    .where(eq(chats.id, chatId));

  if (existingChats.length === 0) {
    await tx.insert(chats).values({
      id: chatId,
      title: "New Chat",
    });
  }
}

// Helper function to handle chat title generation
export async function handleChatTitleGeneration(
  tx: Tx,
  chatId: string,
  messageText: string,
) {
  const [chat] = await tx
    .selectDistinct({ id: chats.id, title: chats.title })
    .from(chats)
    .where(eq(chats.id, chatId));
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!chat) return;

  // Generate title only for new chats
  if (chat.title === "New Chat") {
    const titleResult = await generateObject({
      model: anthropic("claude-3-5-haiku-20241022"),
      prompt: "Generate a title for the chat: " + messageText,
      schema: z.object({ title: z.string() }),
    });

    await tx
      .update(chats)
      .set({ title: titleResult.object.title })
      .where(eq(chats.id, chatId));

    return {
      chatTitle: titleResult.object.title,
      isNewChat: true,
    };
  }

  return {
    chatTitle: chat.title,
    isNewChat: false,
  };
}
