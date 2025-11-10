import { User } from "lucide-react";
import type { ChatUIMessage } from "@/types/chat";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";

interface MessageUserProps {
  message: ChatUIMessage;
}

export function MessageUser({ message }: MessageUserProps) {
  // Get text content from parts
  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return (
    <div className="flex items-start gap-4 flex-row-reverse">
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 flex justify-end">
        <Card className="p-4 max-w-[80%]">
          <p className="whitespace-pre-wrap">{textContent}</p>
        </Card>
      </div>
    </div>
  );
}
