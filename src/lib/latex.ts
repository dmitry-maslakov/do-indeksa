import katex from "katex";

export const latexToHtml = (latex: string) =>
  katex.renderToString(latex, { throwOnError: false, output: "html" });
