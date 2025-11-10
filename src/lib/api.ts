import { hc } from "hono/client";
import type { ChatUIMessage } from "@/types/chat";
import { type ApiRoutes } from "server/index";

export const { api } = hc<ApiRoutes>(window.location.origin);

export async function fetchChatMessages(
  chatId: string,
): Promise<ChatUIMessage[]> {
  const response = await api.chat[":id"].messages.$get({
    param: { id: chatId },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }

  return (await response.json()) as ChatUIMessage[];
}
