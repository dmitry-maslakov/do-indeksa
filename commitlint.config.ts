import type { UserConfig } from "@commitlint/types";

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "content",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "test",
      ],
    ],
  },
} satisfies UserConfig;
