CREATE TABLE "current_runs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"variant_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"run" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "current_runs" ADD CONSTRAINT "current_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;