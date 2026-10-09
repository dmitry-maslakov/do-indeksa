CREATE TABLE "sets" (
	"code" text PRIMARY KEY NOT NULL,
	"task_ids" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
