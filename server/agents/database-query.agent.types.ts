// Type-only file to break circular dependency
// This file is imported by chat.ts types and doesn't import from db

import type { UIMessage } from "ai";

// Placeholder type that will be overridden with actual agent type at runtime
// This allows the database schema to compile without creating a circular dependency
export type DatabaseQueryAgentType = UIMessage;
