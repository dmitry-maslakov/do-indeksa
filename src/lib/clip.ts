export function clip(text: string, length: number) {
  if (text.length <= length) return text;
  const cut = text.slice(0, length - 1);
  const end = cut.lastIndexOf(" ");
  return `${end > 0 ? cut.slice(0, end) : cut}…`;
}
