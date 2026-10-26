import { truncate } from "es-toolkit/compat";
import { toString as plainText } from "mdast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, unified } from "unified";

export const markdown = (plugins: PluggableList = []) =>
  unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(plugins)
    .use(remarkRehype)
    .use(rehypeKatex, { strict: "error" })
    .use(rehypeStringify);

const processor = markdown();

export async function renderMarkdown(
  source: string,
  origin: string,
  renderer = processor,
) {
  const file = await renderer.process(source);
  const [problem] = file.messages;
  if (problem) throw new Error(`${origin}: ${problem.reason}`);
  return String(file);
}

type Node = ReturnType<typeof processor.parse>["children"][number];

const formula = "\0";

function flatten(node: Node, math: (value: string) => string): string {
  if (node.type === "math" || node.type === "inlineMath")
    return math(node.value);
  if ("children" in node) {
    return node.children.map((child) => flatten(child, math)).join("");
  }
  return plainText(node);
}

const readable = (node: Node) =>
  flatten(node, (value) => (/[\\^_{}]/.test(value) ? formula : value));

function prose(nodes: Node[]) {
  const [words = "", ...rest] = nodes.map(readable).join(" ").split(formula);
  const text = words.replace(/\s+/g, " ").trim();
  if (!rest.length) return text;
  const kept = text.replace(/[.,:;]+$/, "");
  return kept && `${kept}…`;
}

export function excerpt(source: string) {
  return truncate(prose(processor.parse(source).children), {
    length: 160,
    separator: " ",
    omission: "…",
  });
}

const flat = (source: string, math: (value: string) => string) =>
  processor
    .parse(source)
    .children.map((node) => flatten(node, math))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export const preview = (source: string) =>
  flat(source, (value) => `$${value}$`);

export const plain = (source: string) => flat(source, (value) => value);

const sentences = new Intl.Segmenter("sr", { granularity: "sentence" });

export function headline(source: string) {
  const [first] = sentences.segment(
    prose(processor.parse(source).children.slice(0, 1)),
  );
  return first?.segment.trim().replace(/[.,:;]+$/, "") ?? "";
}
