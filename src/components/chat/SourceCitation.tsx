import { ExternalLink } from "lucide-react";
import { DatabaseQueryAgentType } from "server/agents/database-query.agent";
import { Button } from "../ui/button";

type MessagePart = DatabaseQueryAgentType extends { parts: (infer P)[] }
  ? P
  : never;

interface SourceCitationProps {
  source: MessagePart;
}

export function SourceCitation({ source }: SourceCitationProps) {
  const url = "url" in source ? source.url : undefined;
  const title = "title" in source ? source.title : undefined;

  if (!url) return null;

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-3 w-3" />
        {title ?? new URL(url).hostname}
      </a>
    </Button>
  );
}
