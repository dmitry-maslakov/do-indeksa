"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClient } from "@/server/action-client";
import { reportKinds } from "./report-kinds";
import { saveReport } from "./reports";
import { taskIdSchema } from "./tasks";

const schema = zfd.formData({
  taskId: taskIdSchema,
  kind: z.enum(reportKinds),
  message: z.string().trim().max(1000),
});

export const reportTask = actionClient
  .inputSchema(schema)
  .action(({ parsedInput, ctx: { profileId } }) =>
    saveReport(profileId, parsedInput),
  );
