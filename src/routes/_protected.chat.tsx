import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useMemo } from "react";
import { ChatMain } from "@/components/chat/ChatMain";
import { useChatStore } from "@/components/ui/chatStore";
export const Route = createFileRoute("/_protected/chat")({
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
      <Suspense
        fallback={
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          </div>
        }
      >
        {/* Use key to force remount when chatId changes */}
        <ChatMain key={chatId} chatId={chatId} />
      </Suspense>
    </div>
  );
}
