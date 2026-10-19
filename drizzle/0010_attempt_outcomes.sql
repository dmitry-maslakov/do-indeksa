DELETE FROM "runs";--> statement-breakpoint
DELETE FROM "attempts";--> statement-breakpoint
CREATE TYPE "public"."part_outcome" AS ENUM('right', 'wrong', 'empty', 'unreadable');--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "outcomes" "part_outcome"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" DROP COLUMN "parts";