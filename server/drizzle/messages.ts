import { AssistantContent, ToolContent, UserContent } from "ai";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { chats } from "./chats.ts";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role")
    .notNull()
    .$type<"system" | "user" | "assistant" | "data">(),
  content: text("content"),
  userContent: jsonb("user_content").$type<UserContent>(),
  assistantContent: jsonb("assistant_content").$type<AssistantContent>(),
  toolContent: jsonb("tool_content").$type<ToolContent>(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
