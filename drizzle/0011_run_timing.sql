DELETE FROM "runs";--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "timed" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "overtime" boolean;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "durations_ms" integer[] NOT NULL;