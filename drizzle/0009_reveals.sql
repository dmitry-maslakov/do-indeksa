CREATE TYPE "public"."reveal_part" AS ENUM('hint1', 'hint2', 'hint3', 'answer', 'solution');--> statement-breakpoint
CREATE TABLE "reveals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"part" "reveal_part" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reveals_user_id_task_id_created_at_index" ON "reveals" USING btree ("user_id","task_id","created_at" DESC NULLS LAST);