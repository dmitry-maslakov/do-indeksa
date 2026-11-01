export const maxParts = 6;

export interface PartLabel {
  letter: string;
  prefix: string | null;
  caption: string | null;
}

export const hasBareTex = (label: string) =>
  /[\^_\\{}]/.test(label.replace(/\$+[^$]*\$+/g, ""));

export function splitLabel(
  label: string | null,
  index: number,
  count: number,
): PartLabel {
  const match = /^([a-e]\))\s*(.*)$/.exec(label ?? "");
  const letter = match?.[1] ?? (count > 1 ? `${index + 1}.` : "");
  const rest = (match ? (match[2] ?? "") : (label ?? "")).trim();
  const bare = rest.replace(/\s*=\s*$/, "");
  if (!rest) return { letter, prefix: null, caption: null };
  if (rest.length <= 8 && !/\s/.test(bare)) {
    return { letter, prefix: `${bare} =`, caption: null };
  }
  if (/=\s*$/.test(rest) && rest.length <= 18) {
    return { letter, prefix: rest, caption: null };
  }
  return { letter, prefix: null, caption: rest };
}

const maths = (text: string) => text.match(/\$\$?[^$]+\$\$?/g) ?? [];

const squash = (latex: string) =>
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

function topLevel(latex: string) {
  const items = [""];
  let depth = 0;
  for (const char of latex) {
    if ("([{".includes(char)) depth++;
    if (")]}".includes(char)) depth--;
    if (char === "," && depth === 0) items.push("");
    else items[items.length - 1] += char;
  }
  return items;
}

const valuesOf = (math: string) =>
  topLevel(squash(math)).flatMap((part) =>
    topLevel(
      (part.split(/=|\\in(?![a-z])/).at(-1) ?? part).replace(
        /^\\\{(.*)\\\}$/,
        "$1",
      ),
    ),
  );

export function answerAddsText(answer: string, expected: string[]) {
  const words = answer
    .replace(/\$[^$]*\$/g, "")
    .replace(/\b(ili|tj|odnosno)\b/gi, "");
  if (/\p{L}{5,}/u.test(words)) return true;
  if (/\\mathbb|[kn]\s*\\in/.test(answer)) return true;
  const items = new Set(expected.flatMap((e) => topLevel(squash(e))));
  return maths(answer).some((math) =>
    valuesOf(math).some((value) => !items.has(value)),
  );
}

export function uncheckedLetters(text: string, parts: PartLabel[]) {
  const checked = new Set(parts.map((p) => p.letter));
  return Array.from(
    text.matchAll(/\*\*([a-e]\))\*\*/g),
    (m) => m[1] ?? "",
  ).filter(
    (letter, i, all) => !checked.has(letter) && all.indexOf(letter) === i,
  );
}
