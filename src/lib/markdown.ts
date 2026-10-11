import { toString as plainText } from "mdast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { clip } from "./clip";

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

export function excerpt(source: string, length = 160) {
  const text = processor
    .parse(source)
    .children.map((node) => plainText(node))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return clip(text, length);
}
