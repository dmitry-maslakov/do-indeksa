export interface PartLabel {
  letter: string;
  prefix: string | null;
  caption: string | null;
}

const asMath = (source: string) =>
  source.includes("$") ? source : `$${source}$`;

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
  const caption = /[_^\\]/.test(rest) ? asMath(rest) : rest;
  return { letter, prefix: null, caption };
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
