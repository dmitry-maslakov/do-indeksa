import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, { strict: "error" })
  .use(rehypeStringify);

export async function renderMarkdown(source: string, origin: string) {
  const file = await processor.process(source);
  const [problem] = file.messages;
  if (problem) throw new Error(`${origin}: ${problem.reason}`);
  return String(file);
}
