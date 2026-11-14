import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  allExams,
  allFaculties,
  allPrograms,
  allTests,
} from "content-collections";
import { expect, it } from "vitest";

const ids = [
  ...[...allFaculties, ...allExams, ...allTests].map((r) => r.id),
  ...allPrograms.map((p) => p.slug),
];
const quoted = new RegExp(`["'\`](${ids.join("|")})["'\`]`, "g");
const examPaths = new RegExp(
  `["'\`](${allExams.map((e) => e.path).join("|")})(?=[/"'\`])`,
  "g",
);
const legacyTable = path.join("lib", "legacy-addresses.ts");

it("keeps faculty, exam, test and programme ids and exam paths out of the code", async () => {
  const files = (await readdir("src", { recursive: true })).filter(
    (file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"),
  );
  const found = await Promise.all(
    files.map(async (file) => {
      const code = await readFile(path.join("src", file), "utf8");
      const paths = file === legacyTable ? [] : [...code.matchAll(examPaths)];
      return [...code.matchAll(quoted), ...paths].map(
        (m) => `${file}: ${m[1]}`,
      );
    }),
  );
  expect(found.flat()).toEqual([]);
});
