import { Bot } from "lucide-react";
import type { ChatUIMessage } from "@/types/chat";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";
import { MessageMarkdown } from "./MessageMarkdown";

interface MessageAssistantProps {
  message: ChatUIMessage;
}

export function MessageAssistant({ message }: MessageAssistantProps) {
  // Get text content from parts
  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Card className="p-4 bg-muted/50">
          {textContent && <MessageMarkdown content={textContent} />}
        </Card>
      </div>
    </div>
  );
}
