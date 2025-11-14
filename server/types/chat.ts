import { UIMessage } from "ai";
import type { DatabaseQueryAgentType } from "server/agents/database-query.agent.ts";

export interface ChatMetadata {
  chatTitle?: string;
  isNewChat?: boolean;
}

export type ChatUIMessage = UIMessage<ChatMetadata> | DatabaseQueryAgentType;
