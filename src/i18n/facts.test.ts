import { createFormatter, createTranslator } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/sr-Latn.json";
import { getFacts } from "./facts";

vi.mock("next-intl/server", () => ({
  getFormatter: async () => createFormatter({ locale: "sr-Latn" }),
  getTranslations: async (namespace: "Facts") =>
    createTranslator({ locale: "sr-Latn", messages, namespace }),
}));

describe("getFacts", () => {
  it("writes dates with the month in the genitive", async () => {
    const facts = await getFacts();
    expect(facts.date("2026-11-13")).toBe("13. novembra 2026.");
    expect(facts.days(["2026-06-29", "2026-06-30"])).toBe("29. i 30. juna");
    expect(facts.days(["2026-06-30", "2026-07-01"])).toBe("30. juna i 1. jula");
    expect(facts.span("2026-06-11", "2026-06-26")).toBe("od 11. do 26. juna");
    expect(facts.span("2026-06-29", "2026-07-02")).toBe(
      "od 29. juna do 2. jula",
    );
  });

  it("writes numbers the Serbian way", async () => {
    const facts = await getFacts();
    expect(facts.score(63.48)).toBe("63,48");
    expect(facts.score(32.8)).toBe("32,80");
    expect(facts.count(140000)).toBe("140.000");
    expect(facts.euro(2000)).toBe("2.000\u00a0€");
    expect(facts.schoolYear(2026)).toBe("2026/27");
    expect(facts.word(5)).toBe("pet");
    expect(facts.word(12)).toBe("12");
    expect(facts.clock("12:00")).toBe("12");
    expect(facts.clock("08:30")).toBe("8.30");
  });
});
