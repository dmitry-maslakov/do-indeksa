import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";
import { images, sections, theoryMarkdown } from "./blocks";

const render = (source: string) =>
  renderMarkdown(source, "theory.md", theoryMarkdown);

describe("theory markdown", () => {
  it("marks known blocks", async () => {
    expect(await render(":::zapamti\nTekst.\n:::")).toBe(
      '<div data-block="zapamti"><p>Tekst.</p></div>',
    );
  });

  it("rejects unknown directives", async () => {
    await expect(render(":::napomena\nTekst.\n:::")).rejects.toThrow(
      'unknown directive "napomena"',
    );
    await expect(render("Odnos a:b.")).rejects.toThrow('unknown directive "b"');
  });

  it("gives sections the ids it lists", async () => {
    const source = "Uvod.\n\n## Jednačine\n\nTekst.\n\n### Detalj";
    expect(sections(source)).toEqual([{ id: "jednacine", title: "Jednačine" }]);
    expect(await render(source)).toContain('<h2 id="jednacine">');
  });

  it("lists images", () => {
    expect(images("Tekst.\n\n![Grafik](graph.svg)")).toEqual(["graph.svg"]);
  });
});
