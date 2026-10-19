"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { authActionClient } from "@/server/action-client";
import { reportKinds } from "./report-kinds";
import { saveReport } from "./reports";
import { taskIdSchema } from "./tasks";

const schema = zfd.formData({
  taskId: taskIdSchema,
  kind: z.enum(reportKinds),
  message: z.string().trim().max(1000),
});

export const reportTask = authActionClient
  .inputSchema(schema)
  .action(({ parsedInput, ctx: { userId } }) =>
    saveReport(userId, parsedInput),
  );
