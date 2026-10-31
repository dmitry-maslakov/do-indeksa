import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import type { TryResult } from "../types";
import { intervalAfter } from "./schedule";

const triesOf = (results: TryResult[]) =>
  results.map((result, i) => ({ at: i * dayMs, result }));

describe("intervalAfter", () => {
  it.each([
    [["wrong"], 1],
    [["partlyRight"], 3],
    [["helped"], 7],
    [["clean"], 30],
    [["wrong", "clean"], 30],
    [["partlyRight", "helped"], 30],
    [["wrong", "wrong"], 3],
    [["clean", "partlyRight"], 3],
    [["wrong", "wrong", "partlyRight"], 6],
    [["wrong", "wrong", "wrong", "wrong"], 6],
    [["wrong", "wrong", "helped", "wrong"], 3],
  ] as [TryResult[], number][])(
    "brings %j back after %i days",
    (results, days) => {
      expect(intervalAfter(triesOf(results))).toBe(days * dayMs);
    },
  );
});
