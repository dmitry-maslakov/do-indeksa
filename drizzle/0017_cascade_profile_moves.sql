ALTER TABLE "attempts" DROP CONSTRAINT "attempts_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "reveals" DROP CONSTRAINT "reveals_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk";
--> statement-breakpoint
ALTER TABLE "task_sessions" DROP CONSTRAINT "task_sessions_test_session_id_profile_id_test_sessions_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk" FOREIGN KEY ("session_id","profile_id","task_id") REFERENCES "public"."task_sessions"("id","profile_id","task_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reveals" ADD CONSTRAINT "reveals_session_id_profile_id_task_id_task_sessions_id_profile_id_task_id_fk" FOREIGN KEY ("session_id","profile_id","task_id") REFERENCES "public"."task_sessions"("id","profile_id","task_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_test_session_id_profile_id_test_sessions_id_profile_id_fk" FOREIGN KEY ("test_session_id","profile_id") REFERENCES "public"."test_sessions"("id","profile_id") ON DELETE cascade ON UPDATE cascade;