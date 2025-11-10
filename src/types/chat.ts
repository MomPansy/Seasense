import { UIMessage } from "ai";

export interface ChatMetadata {
  chatTitle?: string;
  isNewChat?: boolean;
}

export type ChatUIMessage = UIMessage<ChatMetadata>;
