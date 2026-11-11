import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { allExams, allFaculties, allTests } from "content-collections";
import { expect, it } from "vitest";

const ids = [...allFaculties, ...allExams, ...allTests].map((r) => r.id);
const quoted = new RegExp(`["'\`](${ids.join("|")})["'\`]`, "g");

it("keeps faculty, exam and test ids out of the code", async () => {
  const files = (await readdir("src", { recursive: true })).filter(
    (file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"),
  );
  const found = await Promise.all(
    files.map(async (file) => {
      const code = await readFile(path.join("src", file), "utf8");
      return [...code.matchAll(quoted)].map((m) => `${file}: ${m[1]}`);
    }),
  );
  expect(found.flat()).toEqual([]);
});
