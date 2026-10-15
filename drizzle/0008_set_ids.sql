ALTER TABLE "sets" DROP CONSTRAINT "sets_pkey";--> statement-breakpoint
ALTER TABLE "sets" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "id" integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "sets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
CREATE UNIQUE INDEX "sets_task_ids_index" ON "sets" USING btree ("task_ids") WHERE "sets"."code" is null;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_code_unique" UNIQUE("code");
