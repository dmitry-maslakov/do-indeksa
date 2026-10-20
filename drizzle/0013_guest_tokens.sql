ALTER TABLE "profiles" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tokenHash_unique" UNIQUE("token_hash");