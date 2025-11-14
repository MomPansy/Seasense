import { Database, Globe, Search } from "lucide-react";
import { DatabaseQueryAgentType } from "server/agents/database-query.agent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";

type MessagePart = DatabaseQueryAgentType extends { parts: (infer P)[] }
  ? P
  : never;

interface ToolCallProps {
  tool: MessagePart;
  isStreaming?: boolean;
}

export function ToolCall({ tool, isStreaming = false }: ToolCallProps) {
  const getToolIcon = () => {
    switch (tool.type) {
      case "tool-queryDatabase":
        return <Database className="h-4 w-4" />;
      case "tool-web_search":
        return <Search className="h-4 w-4" />;
      case "tool-web_fetch":
        return <Globe className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getToolLabel = () => {
    switch (tool.type) {
      case "tool-queryDatabase":
        return "Querying database";
      case "tool-web_search":
        return "Searching web";
      case "tool-web_fetch":
        return "Fetching webpage";
      default:
        return "Running tool";
    }
  };

  // Get preview of input
  const getInputPreview = () => {
    if (!("input" in tool) || tool.input === undefined) return "";
    const inputStr =
      typeof tool.input === "string" ? tool.input : JSON.stringify(tool.input);
    return inputStr.slice(0, 50);
  };

  const inputPreview = getInputPreview();

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tool" className="border-none">
          <AccordionTrigger className="px-3 py-2.5 hover:no-underline [&[data-state=open]>div>span]:line-clamp-none">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-1">
              <span className={isStreaming ? "animate-pulse" : ""}>
                {getToolIcon()}
              </span>
              <span
                className={`font-medium flex-shrink-0 ${
                  isStreaming ? "animate-pulse" : ""
                }`}
              >
                {getToolLabel()}
              </span>
              {inputPreview && (
                <span className="truncate text-xs opacity-70 font-normal font-mono">
                  {inputPreview}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-0">
            <div className="space-y-2">
              {"input" in tool && tool.input !== undefined && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Input:
                  </div>
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                    {typeof tool.input === "string"
                      ? tool.input
                      : JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>
              )}
              {"output" in tool && tool.output !== undefined && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Output:
                  </div>
                  <ScrollArea className="h-64 rounded-md border bg-background/50">
                    <pre className="text-xs p-2 whitespace-pre-wrap break-all">
                      {typeof tool.output === "string"
                        ? tool.output
                        : JSON.stringify(tool.output, null, 2)}
                    </pre>
                  </ScrollArea>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
