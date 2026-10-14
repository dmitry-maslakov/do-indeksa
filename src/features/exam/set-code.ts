import { createHash } from "node:crypto";

export const setCode = (taskIds: string[]) =>
  createHash("sha256")
    .update(taskIds.join("."))
    .digest("base64url")
    .slice(0, 7);
