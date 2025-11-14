import { Brain } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface ReasoningStepProps {
  content: string;
  isStreaming?: boolean;
}

export function ReasoningStep({
  content,
  isStreaming = false,
}: ReasoningStepProps) {
  // Get preview text (first line or first 60 chars)
  const previewText = content.split("\n")[0].slice(0, 60);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="reasoning" className="border-none">
          <AccordionTrigger className="px-3 py-2.5 hover:no-underline [&[data-state=open]>div>span]:line-clamp-none">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-1">
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span
                className={`font-medium flex-shrink-0 ${
                  isStreaming ? "animate-pulse" : ""
                }`}
              >
                Thinking
              </span>
              {previewText && (
                <span className="truncate text-xs opacity-70 font-normal">
                  {previewText}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-0">
            <div className="text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
