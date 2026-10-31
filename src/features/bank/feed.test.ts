import { describe, expect, it } from "vitest";
import { summarize, tasks } from "@/features/catalog/tasks";
import { renderMarkdown } from "@/lib/markdown";
import { bankPage } from "./feed";

const summaries = tasks.map(summarize);

describe("bankPage", () => {
  it("sends each statement as the HTML of its Markdown", async () => {
    const { items } = await bankPage(summaries, 0, "sr-Latn");
    const expected = await Promise.all(
      tasks.slice(0, items.length).map((t) => renderMarkdown(t.text, t.id)),
    );
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((card) => card.statement)).toEqual(expected);
    expect(items.some((card) => card.statement.includes('class="katex"'))).toBe(
      true,
    );
  });

  it("continues from the offset and ends on the last page", async () => {
    const list = Array.from({ length: 18 }, () => summaries)
      .flat()
      .slice(0, 18);
    const pages = [
      await bankPage(list, 0, "sr-Latn"),
      await bankPage(list, 3, "sr-Latn"),
      await bankPage(list, 13, "sr-Latn"),
    ];
    expect(pages.map((page) => [page.items.length, page.next])).toEqual([
      [3, 3],
      [10, 13],
      [5, null],
    ]);
    expect(pages[1]?.items.map((card) => card.id)).toEqual(
      list.slice(3, 13).map((task) => task.id),
    );
  });
});
