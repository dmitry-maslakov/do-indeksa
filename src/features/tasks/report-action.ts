"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { reports } from "@/db/schema";
import { authActionClient } from "@/server/action-client";
import { db } from "@/server/db";
import { reportKinds } from "./report-kinds";
import { taskIdSchema } from "./tasks";

const schema = zfd.formData({
  taskId: taskIdSchema,
  kind: z.enum(reportKinds),
  message: z.string().trim().max(1000),
});

export const reportTask = authActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await db.insert(reports).values({ ...parsedInput, userId });
  });
