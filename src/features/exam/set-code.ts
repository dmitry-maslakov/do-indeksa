import { createHash } from "node:crypto";

const codeLength = 16;

export const setCode = (taskIds: string[]) =>
  createHash("sha256")
    .update(taskIds.join("."))
    .digest("base64url")
    .slice(0, codeLength);
