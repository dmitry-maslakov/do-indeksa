CREATE TYPE "public"."test_kind" AS ENUM('official', 'curated', 'daily', 'random', 'custom');--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"kind" "test_kind" NOT NULL,
	"variant_id" text NOT NULL,
	"task_ids" text[] NOT NULL,
	"timed" boolean NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"overtime" boolean,
	"draft" jsonb,
	CONSTRAINT "test_sessions_id_profileId_unique" UNIQUE("id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "test_sessions_profile_id_updated_at_index" ON "test_sessions" USING btree ("profile_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "test_session_id" uuid;--> statement-breakpoint
INSERT INTO "test_sessions" ("id", "profile_id", "kind", "variant_id", "task_ids", "timed", "started_at", "updated_at", "finished_at", "overtime") SELECT "id", "profile_id", "kind"::text::"test_kind", "variant_id", "task_ids", "timed", "started_at", "finished_at", "finished_at", "overtime" FROM "runs";--> statement-breakpoint
INSERT INTO "task_sessions" ("profile_id", "task_id", "test_session_id", "started_at", "last_seen_at") SELECT r."profile_id", t."task_id", r."id", r."started_at", r."started_at" + coalesce(t."ms", 0) * interval '1 millisecond' FROM "runs" r, unnest(r."task_ids", r."durations_ms") AS t("task_id", "ms") WHERE t."task_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_one_owner";--> statement-breakpoint
ALTER TABLE "reveals" DROP CONSTRAINT "reveals_one_owner";--> statement-breakpoint
UPDATE "attempts" SET "session_id" = s."id" FROM "task_sessions" s WHERE "attempts"."run_id" = s."test_session_id" AND "attempts"."task_id" = s."task_id";--> statement-breakpoint
UPDATE "reveals" SET "session_id" = s."id" FROM "task_sessions" s WHERE "reveals"."run_id" = s."test_session_id" AND "reveals"."task_id" = s."task_id";--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_runId_taskId_unique";--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_run_id_runs_id_fk";--> statement-breakpoint
ALTER TABLE "reveals" DROP CONSTRAINT "reveals_run_id_profile_id_runs_id_profile_id_fk";--> statement-breakpoint
DROP INDEX "reveals_run_id_index";--> statement-breakpoint
ALTER TABLE "attempts" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "reveals" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reveals" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_test_session_id_profile_id_test_sessions_id_profile_id_fk" FOREIGN KEY ("test_session_id","profile_id") REFERENCES "public"."test_sessions"("id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_sessions_test_session_id_index" ON "task_sessions" USING btree ("test_session_id");--> statement-breakpoint
DROP TABLE "current_runs";--> statement-breakpoint
DROP TABLE "runs";--> statement-breakpoint
DROP TYPE "public"."run_kind";
