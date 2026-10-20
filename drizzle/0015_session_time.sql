ALTER TABLE "task_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "task_sessions" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "task_sessions" SET "last_seen_at" = greatest("started_at", coalesce((SELECT max("created_at") FROM "attempts" WHERE "attempts"."session_id" = "task_sessions"."id"), "started_at"));--> statement-breakpoint
ALTER TABLE "attempts" DROP COLUMN "duration_ms";