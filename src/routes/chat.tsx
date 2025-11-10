import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChatMain } from "@/components/chat/ChatMain";
import { useChatStore } from "@/components/ui/chatStore";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || undefined,
    };
  },
});

function ChatPage() {
  const { id } = Route.useSearch();
  const createChat = useChatStore((state) => state.createChat);

  // Derive chatId: use URL id if available, otherwise create new chat
  const chatId = useMemo(() => {
    if (id) {
      return id;
    }
    return createChat();
  }, [id, createChat]);

  return (
    <div className="flex flex-col h-full">
      <ChatMain chatId={chatId} />
    </div>
  );
}
