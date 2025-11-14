ALTER TABLE "messages" ADD COLUMN "ui_message" jsonb;
ALTER TABLE "messages" DROP COLUMN "user_content";
ALTER TABLE "messages" DROP COLUMN "assistant_content";
ALTER TABLE "messages" DROP COLUMN "tool_content";