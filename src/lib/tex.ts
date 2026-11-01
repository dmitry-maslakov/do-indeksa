export const squash = (latex: string) =>
  latex
    .replaceAll("$", "")
    .replace(/\\left|\\right|\\[,;! ]|\s/g, "")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\\frac(\w)(\w)/g, "\\frac{$1}{$2}")
    .replace(/\\sqrt(\w)/g, "\\sqrt{$1}")
    .replaceAll("\\lbrace", "\\{")
    .replaceAll("\\rbrace", "\\}")
    .replaceAll("\\lbrack", "[")
    .replaceAll("\\rbrack", "]");

export function topLevel(latex: string, separators = ",") {
  const items = [""];
  let depth = 0;
  for (const char of latex) {
    if ("([{".includes(char)) depth++;
    if (")]}".includes(char)) depth--;
    if (separators.includes(char) && depth === 0) items.push("");
    else items[items.length - 1] += char;
  }
  return items;
}

export function groupOf(latex: string, separators = ",") {
  if (!/^[([].*[)\]]$/.test(latex)) return null;
  let depth = 0;
  for (const [i, char] of Array.from(latex).entries()) {
    if ("([{".includes(char)) depth++;
    if (")]}".includes(char)) depth--;
    if (depth === 0 && i < latex.length - 1) return null;
  }
  return {
    open: latex.slice(0, 1),
    close: latex.slice(-1),
    items: topLevel(latex.slice(1, -1), separators),
  };
}
