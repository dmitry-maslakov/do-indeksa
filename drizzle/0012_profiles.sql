CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "profiles" ("user_id") SELECT "id" FROM "user";--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "current_runs" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "reveals" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
UPDATE "attempts" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "attempts"."user_id";--> statement-breakpoint
UPDATE "current_runs" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "current_runs"."user_id";--> statement-breakpoint
UPDATE "favorites" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "favorites"."user_id";--> statement-breakpoint
UPDATE "reports" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "reports"."user_id";--> statement-breakpoint
UPDATE "runs" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "runs"."user_id";--> statement-breakpoint
UPDATE "reveals" SET "profile_id" = "profiles"."id" FROM "profiles" WHERE "profiles"."user_id" = "reveals"."user_id";--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "current_runs" DROP CONSTRAINT "current_runs_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "runs" DROP CONSTRAINT "runs_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "reveals" DROP CONSTRAINT "reveals_user_id_user_id_fk";--> statement-breakpoint
DROP INDEX "attempts_user_id_created_at_index";--> statement-breakpoint
DROP INDEX "attempts_user_id_task_id_created_at_index";--> statement-breakpoint
DROP INDEX "runs_user_id_finished_at_index";--> statement-breakpoint
DROP INDEX "reveals_user_id_task_id_created_at_index";--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_task_id_pk";--> statement-breakpoint
ALTER TABLE "current_runs" DROP CONSTRAINT "current_runs_pkey";--> statement-breakpoint
ALTER TABLE "attempts" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "current_runs" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "favorites" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "runs" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "reveals" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reveals" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "current_runs" ADD PRIMARY KEY ("profile_id");--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_profile_id_task_id_pk" PRIMARY KEY("profile_id","task_id");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_runs" ADD CONSTRAINT "current_runs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_profile_id_created_at_index" ON "attempts" USING btree ("profile_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "attempts_profile_id_task_id_created_at_index" ON "attempts" USING btree ("profile_id","task_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "runs_profile_id_finished_at_index" ON "runs" USING btree ("profile_id","finished_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reveals_profile_id_task_id_created_at_index" ON "reveals" USING btree ("profile_id","task_id","created_at" DESC NULLS LAST);
