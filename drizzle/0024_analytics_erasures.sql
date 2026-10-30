CREATE TABLE "analytics_erasures" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
