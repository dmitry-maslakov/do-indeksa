import { deburr, kebabCase } from "es-toolkit";
import type { Heading, Root, RootContent } from "mdast";
import { toString as plainText } from "mdast-util-to-string";
import remarkDirective from "remark-directive";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { markdown } from "@/lib/markdown";

const blockNames = new Set(["zapamti", "primer", "greska", "formule"]);

const isSection = (node: RootContent): node is Heading =>
  node.type === "heading" && node.depth === 2;

const sectionId = (heading: Heading) => kebabCase(deburr(plainText(heading)));

const blocks: Plugin<[], Root> = () => (tree, file) => {
  for (const heading of tree.children.filter(isSection)) {
    heading.data = { hProperties: { id: sectionId(heading) } };
  }
  visit(tree, (node) => {
    if (
      node.type !== "containerDirective" &&
      node.type !== "leafDirective" &&
      node.type !== "textDirective"
    )
      return;
    if (node.type !== "containerDirective" || !blockNames.has(node.name))
      file.fail(`unknown directive "${node.name}"`, node);
    node.data = { hName: "div", hProperties: { dataBlock: node.name } };
  });
};

export const theoryPlugins = [remarkDirective, blocks];

export const theoryMarkdown = markdown(theoryPlugins);

export const sections = (source: string) =>
  theoryMarkdown
    .parse(source)
    .children.filter(isSection)
    .map((heading) => ({ id: sectionId(heading), title: plainText(heading) }));

export function images(source: string) {
  const urls: string[] = [];
  visit(theoryMarkdown.parse(source), "image", (node) => {
    urls.push(node.url);
  });
  return urls;
}
