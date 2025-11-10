import { useChat } from "@ai-sdk/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useChatStore } from "@/components/ui/chatStore";
import { fetchChatMessages } from "@/lib/api";
import type { ChatUIMessage } from "@/types/chat";
import { ChatFooter } from "./ChatFooter";
import { MessageAssistant } from "./MessageAssistant";
import { MessageUser } from "./MessageUser";

const chatUrl = import.meta.env.DEV
  ? "http://localhost:3000/api/chat"
  : "/api/chat";

interface ChatMainProps {
  chatId: string;
}

export function ChatMain({ chatId }: ChatMainProps) {
  const queryClient = useQueryClient();
  const setChatTitle = useChatStore((state) => state.setChatTitle);
  const setStreaming = useChatStore((state) => state.setStreaming);
  const removeChat = useChatStore((state) => state.removeChat);

  // Fetch existing messages for this chat using Suspense
  const { data: initialMessages } = useSuspenseQuery<ChatUIMessage[]>({
    queryKey: ["chat", chatId, "messages"],
    queryFn: async () => await fetchChatMessages(chatId),
    staleTime: Infinity, // Messages don't change unless we update them
  });

  const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
    id: chatId,
    messages: initialMessages,
    // Pass the fetched messages to initialize the chat
    transport: new DefaultChatTransport({
      api: chatUrl,
    }),
    onFinish: ({ message }) => {
      // Mark streaming as complete
      setStreaming(chatId, false);

      // Extract title from message metadata when streaming finishes
      if (message.metadata?.chatTitle && message.metadata.isNewChat) {
        setChatTitle(chatId, message.metadata.chatTitle);
      }

      // Invalidate queries to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      // Remove from active chats after first message completes and chat is saved
      if (message.metadata?.isNewChat) {
        removeChat(chatId);
      }
    },
  });

  // Track when streaming starts
  const isStreaming = status === "streaming";
  if (isStreaming) {
    setStreaming(chatId, true);
  }

  // Derive chat title from messages
  const chatTitle = messages.find((m) => m.role === "assistant")?.metadata
    ?.chatTitle;

  return (
    <div className="flex flex-col h-full">
      {/* Display chat title if available */}
      {chatTitle && messages.length > 0 && (
        <div className="px-6 pt-4 pb-2 border-b">
          <h1 className="text-xl font-semibold">{chatTitle}</h1>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              What can I help you with?
            </h2>
            <p className="text-muted-foreground">
              Start a conversation by typing a message below
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 pb-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <MessageUser key={message.id} message={message} />
                ) : (
                  <MessageAssistant key={message.id} message={message} />
                ),
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className={
          messages.length > 0 ? "sticky bottom-0 bg-background border-t" : ""
        }
      >
        <ChatFooter sendMessage={sendMessage} status={status} />
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
