import type { UseChatHelpers } from "@ai-sdk/react";
import { Send, Square } from "lucide-react";
import { useState, FormEvent } from "react";
import type { ChatUIMessage } from "@/types/chat";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

type ChatFooterProps = Pick<
  UseChatHelpers<ChatUIMessage>,
  "sendMessage" | "status"
>;

export function ChatFooter({ sendMessage, status }: ChatFooterProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage({ text: input });
        setInput("");
      }
    }
  };

  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-b from-white/60 to-white pb-6 shadow-[0_0_30px_30px_rgba(255,255,255,0.6)]">
      <div className="max-w-4xl mx-auto px-6">
        <form onSubmit={handleSubmit}>
          <div className="relative border-1 rounded-md">
            <Textarea
              className="min-h-[80px] pr-12 resize-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="absolute right-2 bottom-2">
              {status === "streaming" ? (
                <Button
                  type="button"
                  size="icon"
                  variant="default"
                  className="h-8 w-8"
                  onClick={() => {
                    // Add stop functionality if needed
                  }}
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  variant="default"
                  className="h-8 w-8"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
