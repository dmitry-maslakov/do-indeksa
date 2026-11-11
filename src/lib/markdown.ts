import { truncate } from "es-toolkit/compat";
import type { Element, Root } from "hast";
import { toString as plainText } from "mdast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, type Plugin, unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

const hasClass = (node: Element, name: string) => {
  const classes = node.properties.className;
  return Array.isArray(classes) && classes.includes(name);
};

const glyph = (text: string): Element => ({
  type: "element",
  tagName: "span",
  properties: { dataText: text },
  children: [],
});

const drawGlyphs = (html: Element) =>
  visit(html, "text", (text, index, parent) => {
    if (parent?.type !== "element" || index === undefined) return;
    if (parent.children.length > 1) {
      parent.children[index] = glyph(text.value);
      return;
    }
    parent.properties.dataText = text.value;
    parent.children = [];
  });

export const mathTextOnce: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (node.tagName === "annotation" && parent && index !== undefined) {
      parent.children.splice(index, 1);
      return index;
    }
    if (!hasClass(node, "katex-html")) return;
    drawGlyphs(node);
    return SKIP;
  });
};

export const markdown = (plugins: PluggableList = []) =>
  unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(plugins)
    .use(remarkRehype)
    .use(rehypeKatex, { strict: "error" })
    .use(mathTextOnce)
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

const previewLength = 140;

export function preview(source: string) {
  const parts = flat(source, (value) => `$${value}$`).split(/(\$[^$]+\$)/);
  let kept = "";
  for (const part of parts) {
    if (kept.length + part.length > previewLength) {
      if (part.startsWith("$")) return kept.trimEnd();
      const length = previewLength - kept.length;
      return (
        kept + part.slice(0, length + 1).replace(/\s*\S*$/, "")
      ).trimEnd();
    }
    kept += part;
  }
  return kept;
}

const sentences = new Intl.Segmenter("sr", { granularity: "sentence" });

export function headline(source: string) {
  const [first] = sentences.segment(
    prose(processor.parse(source).children.slice(0, 1)),
  );
  return first?.segment.trim().replace(/[.,:;]+$/, "") ?? "";
}
