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

type Node = ReturnType<typeof processor.parse>["children"][number];

const formula = "\0";

function readable(node: Node): string {
  if (node.type === "math" || node.type === "inlineMath") {
    return /[\\^_{}]/.test(node.value) ? formula : node.value;
  }
  if ("children" in node) return node.children.map(readable).join("");
  return plainText(node);
}

function prose(nodes: Node[]) {
  const [words = "", ...rest] = nodes.map(readable).join(" ").split(formula);
  const text = words.replace(/\s+/g, " ").trim();
  if (!rest.length) return text;
  const kept = text.replace(/[.,:;]+$/, "");
  return kept && `${kept}…`;
}

export function excerpt(source: string, length = 160) {
  return clip(prose(processor.parse(source).children), length);
}
