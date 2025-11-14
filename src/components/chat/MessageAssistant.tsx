import { Bot } from "lucide-react";
import { Activity } from "react";
import { DatabaseQueryAgentType } from "server/agents/database-query.agent";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";
import { MessageMarkdown } from "./MessageMarkdown";
import { ReasoningStep } from "./ReasoningStep";
import { SourceCitation } from "./SourceCitation";
import { ToolCall } from "./ToolCall";

type MessagePart = DatabaseQueryAgentType extends { parts: (infer P)[] }
  ? P
  : never;

interface MessageAssistantProps {
  message: DatabaseQueryAgentType;
  isStreaming?: boolean;
}

export function MessageAssistant({
  message,
  isStreaming = false,
}: MessageAssistantProps) {
  // Separate parts by type and order
  const thinkingParts: MessagePart[] = [];
  const finalAnswerParts: MessagePart[] = [];
  const toolParts: MessagePart[] = [];
  const sourceParts: MessagePart[] = [];

  let lastToolOrSourceIndex = -1;

  // Find the last index of tool calls or sources
  message.parts.forEach((part, index) => {
    if (
      part.type === "tool-queryDatabase" ||
      part.type === "tool-web_search" ||
      part.type === "tool-web_fetch" ||
      part.type === "source-url"
    ) {
      lastToolOrSourceIndex = index;
    }
  });

  // Categorize parts
  message.parts.forEach((part, index) => {
    if (
      part.type === "tool-queryDatabase" ||
      part.type === "tool-web_search" ||
      part.type === "tool-web_fetch"
    ) {
      toolParts.push(part);
    } else if (part.type === "source-url") {
      sourceParts.push(part);
    } else if (part.type === "text") {
      // Text parts after the last tool/source are final answer
      // Text parts before are thinking steps
      if (index > lastToolOrSourceIndex) {
        finalAnswerParts.push(part);
      } else {
        thinkingParts.push(part);
      }
    }
  });

  const finalAnswer = finalAnswerParts
    .map((part) => ("text" in part ? part.text : ""))
    .join("");

  const thinkingSteps = thinkingParts
    .map((part) => ("text" in part ? part.text : ""))
    .join("\n\n");

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Activity mode={thinkingSteps ? "visible" : "hidden"}>
          <ReasoningStep content={thinkingSteps} isStreaming={isStreaming} />
        </Activity>

        <Activity mode={toolParts.length > 0 ? "visible" : "hidden"}>
          <div className="space-y-2">
            {toolParts.map((tool, index) => (
              <ToolCall
                key={index}
                tool={tool}
                isStreaming={isStreaming && index === toolParts.length - 1}
              />
            ))}
          </div>
        </Activity>

        <Activity mode={finalAnswer ? "visible" : "hidden"}>
          <Card className="p-4 bg-muted/50">
            <MessageMarkdown content={finalAnswer} />
          </Card>
        </Activity>

        <Activity mode={sourceParts.length > 0 ? "visible" : "hidden"}>
          <div className="flex flex-wrap gap-1 mt-2">
            {sourceParts.map((source, index) => (
              <SourceCitation key={index} source={source} />
            ))}
          </div>
        </Activity>
      </div>
    </div>
  );
}
