CREATE TABLE "task_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"task_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "task_sessions_id_profileId_taskId_unique" UNIQUE("id","profile_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "reveals" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "reveals" ADD COLUMN "run_id" uuid;--> statement-breakpoint
INSERT INTO "task_sessions" ("id", "profile_id", "task_id", "started_at") SELECT "id", "profile_id", "task_id", "created_at" - "duration_ms" * interval '1 millisecond' FROM "attempts" WHERE "run_id" IS NULL;--> statement-breakpoint
UPDATE "attempts" SET "session_id" = "id" WHERE "run_id" IS NULL;--> statement-breakpoint
INSERT INTO "task_sessions" ("id", "profile_id", "task_id", "started_at") SELECT "id", "profile_id", "task_id", "created_at" FROM "reveals";--> statement-breakpoint
UPDATE "reveals" SET "session_id" = "id";--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_id_profileId_unique" UNIQUE("id","profile_id");--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_sessions_profile_id_task_id_started_at_index" ON "task_sessions" USING btree ("profile_id","task_id","started_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk" FOREIGN KEY ("session_id","profile_id","task_id") REFERENCES "public"."task_sessions"("id","profile_id","task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk" FOREIGN KEY ("session_id","profile_id","task_id") REFERENCES "public"."task_sessions"("id","profile_id","task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_run_id_profile_id_runs_id_profile_id_fk" FOREIGN KEY ("run_id","profile_id") REFERENCES "public"."runs"("id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_session_id_index" ON "attempts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "reveals_session_id_index" ON "reveals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "reveals_run_id_index" ON "reveals" USING btree ("run_id");--> statement-breakpoint
ALTER TABLE "attempts" DROP COLUMN "hints_used";--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_one_owner" CHECK (num_nonnulls("attempts"."run_id", "attempts"."session_id") = 1);--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_one_owner" CHECK (num_nonnulls("reveals"."run_id", "reveals"."session_id") = 1);