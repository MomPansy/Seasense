import { redirect } from "@tanstack/react-router";
import { hc } from "hono/client";
import { type ApiRoutes } from "server/index";
import type { ChatUIMessage } from "server/types/chat";

// Note: This must be imported and used at the module level, not inside a React component
// Clerk's useAuth() hook cannot be called here because this is not a React component
let clerkGetToken: (() => Promise<string | null>) | null = null;

// Call this once in your app initialization to set up auth
export function initializeApiAuth(getToken: () => Promise<string | null>) {
  clerkGetToken = getToken;
}

// Helper to attach required auth headers for backend
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!clerkGetToken) {
    console.warn("API auth not initialized. Call initializeApiAuth() first.");
    return {};
  }

  const token = await clerkGetToken();

  if (!token) {
    redirect({ throw: true, to: "/sign-in" });
  }

  return {
    authorization: `Bearer ${token}`,
  };
}

export const { api } = hc<ApiRoutes>(window.location.origin, {
  headers: async () => {
    return await getAuthHeaders();
  },
});

export async function fetchChatMessages(chatId: string) {
  const response = await api.chat[":id"].messages.$get({
    param: { id: chatId },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }

  const data = await response.json();

  return data as ChatUIMessage[];
}
