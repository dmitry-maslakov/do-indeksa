import "katex/dist/katex.min.css";
import type { Root } from "hast";
import { toHtml } from "hast-util-to-html";
import Markdown, { type Components, defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { KatexHtml } from "@/components/math-html";
import { Block } from "./block";
import { theoryPlugins } from "./blocks";

const katexRoots = ["katex", "katex-display"];

const collapseMath: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node) => {
    const classes = node.properties.className;
    const root =
      Array.isArray(classes) &&
      classes.some((c) => katexRoots.includes(String(c)));
    if (!root) return;
    node.properties.dataHtml = toHtml(node.children);
    node.children = [];
    return SKIP;
  });
};

const remarkPlugins = [remarkMath, ...theoryPlugins];
const rehypePlugins = [rehypeKatex, collapseMath];

const MathSpan: Components["span"] = ({ node, children, ...props }) => {
  const html = node?.properties.dataHtml;
  if (typeof html !== "string") return <span {...props}>{children}</span>;
  return <KatexHtml html={html} className={props.className} />;
};

interface TheoryMarkdownProps {
  source: string;
  variant: "topic" | "method";
  images?: Record<string, string>;
}

export function TheoryMarkdown({
  source,
  variant,
  images = {},
}: TheoryMarkdownProps) {
  return (
    <div className="theory" data-variant={variant}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        urlTransform={(url) => images[url] ?? defaultUrlTransform(url)}
        components={{
          span: MathSpan,
          div: ({ node, children }) => (
            <Block
              name={String(node?.properties.dataBlock)}
              tagged={variant === "topic"}
            >
              {children}
            </Block>
          ),
        }}
      >
        {source}
      </Markdown>
    </div>
  );
}

export function InlineMarkdown({ source }: { source: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={rehypePlugins}
      components={{ span: MathSpan }}
      disallowedElements={["p"]}
      unwrapDisallowed
    >
      {source}
    </Markdown>
  );
}
