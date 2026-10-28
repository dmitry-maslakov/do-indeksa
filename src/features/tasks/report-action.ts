"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { reportKinds } from "@/db/columns";
import { taskIdSchema } from "@/features/catalog/tasks";
import { actionClient } from "@/server/action-client";
import { saveReport } from "./reports";

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
