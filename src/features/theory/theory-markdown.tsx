import "katex/dist/katex.min.css";
import Markdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Block } from "./block";
import { theoryPlugins } from "./blocks";

const remarkPlugins = [remarkMath, ...theoryPlugins];
const rehypePlugins = [rehypeKatex];

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
      disallowedElements={["p"]}
      unwrapDisallowed
    >
      {source}
    </Markdown>
  );
}
