UPDATE "test_sessions" SET "kind" = 'custom', "variant_id" = 'set-' || array_to_string("task_ids", '.') WHERE "kind" = 'daily';--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."test_kind";--> statement-breakpoint
CREATE TYPE "public"."test_kind" AS ENUM('official', 'curated', 'random', 'custom');--> statement-breakpoint
ALTER TABLE "test_sessions" ALTER COLUMN "kind" SET DATA TYPE "public"."test_kind" USING "kind"::"public"."test_kind";