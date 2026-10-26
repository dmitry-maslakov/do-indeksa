DELETE FROM "test_sessions";--> statement-breakpoint
DELETE FROM "task_sessions";--> statement-breakpoint
CREATE TYPE "public"."session_kind" AS ENUM('first', 'retry', 'mock');--> statement-breakpoint
CREATE TYPE "public"."suggestion_reason" AS ENUM('first', 'stuck', 'next', 'almost', 'started', 'done');--> statement-breakpoint
CREATE TABLE "skips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"task_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"reason" "suggestion_reason" NOT NULL,
	"shown_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "client_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "difficulty" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "key_rev" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "checker" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "kind" "session_kind" NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "tz" text;--> statement-breakpoint
ALTER TABLE "skips" ADD CONSTRAINT "skips_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skips" ADD CONSTRAINT "skips_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk" FOREIGN KEY ("session_id","profile_id","task_id") REFERENCES "public"."task_sessions"("id","profile_id","task_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skips_profile_id_task_id_created_at_index" ON "skips" USING btree ("profile_id","task_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "skips_session_id_index" ON "skips" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "suggestions_profile_id_topic_shown_at_index" ON "suggestions" USING btree ("profile_id","topic","shown_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_profileId_clientId_unique" UNIQUE("profile_id","client_id");