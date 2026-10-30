import { describe, expect, it } from "vitest";
import { dayMs, hourMs, minuteMs } from "@/lib/dates";
import { observe } from "./observation";
import { defaultPolicy } from "./policy";
import type { FirstAttempt, LoggedSubmit } from "./types";

const start = Date.parse("2026-10-20T10:00:00Z");
const now = start + 3 * hourMs;

const submit = (
  minutes: number,
  outcomes: LoggedSubmit["outcomes"],
  keyRev = "k1",
): LoggedSubmit => ({
  at: start + minutes * minuteMs,
  outcomes,
  correct: outcomes.every((o) => o === "right"),
  difficulty: 3,
  keyRev,
});

const attempt = (over: Partial<FirstAttempt>): FirstAttempt => ({
  taskId: "t1",
  topic: "logarithms",
  keyRev: "k1",
  tz: "Europe/Belgrade",
  submits: [],
  reveals: [],
  skips: [],
  ...over,
});

const at = (minutes: number) => start + minutes * minuteMs;

describe("observe", () => {
  it("counts a first right answer without help as clean", () => {
    expect(
      observe(attempt({ submits: [submit(1, ["right"])] }), now),
    ).toMatchObject({
      result: "clean",
      credit: 1,
      difficulty: 3,
      day: "2026-10-20",
    });
  });

  it("counts a right answer after a hint as helped", () => {
    const result = observe(
      attempt({
        submits: [submit(5, ["right"])],
        reveals: [{ at: at(2), part: "hint1" }],
      }),
      now,
    );
    expect(result).toMatchObject({ result: "helped", credit: 0.4 });
  });

  it("counts a right second submit as helped", () => {
    const result = observe(
      attempt({ submits: [submit(1, ["wrong"]), submit(3, ["right"])] }),
      now,
    );
    expect(result).toMatchObject({ result: "helped", at: at(3) });
  });

  it("gives a fail partial credit for the parts right in the last answer", () => {
    const result = observe(
      attempt({
        submits: [submit(1, ["right", "right", "wrong"])],
        reveals: [{ at: at(2), part: "solution" }],
      }),
      now,
    );
    expect(result?.result).toBe("fail");
    expect(result?.credit).toBeCloseTo(0.4 * (2 / 3));
    expect(result?.at).toBe(at(2));
  });

  it("keeps a wrong answer open until an hour after the last event", () => {
    const open = attempt({ submits: [submit(1, ["wrong"])] });
    expect(observe(open, at(60))).toBeUndefined();
    expect(observe(open, at(61))).toMatchObject({ result: "fail", credit: 0 });
  });

  it("doesn't count a right answer given after the solution was opened", () => {
    const result = observe(
      attempt({
        submits: [submit(1, ["wrong"]), submit(5, ["right"])],
        reveals: [{ at: at(3), part: "answer" }],
      }),
      now,
    );
    expect(result).toMatchObject({ result: "fail", at: at(3) });
  });

  it("leaves out a task studied before any answer", () => {
    expect(
      observe(
        attempt({
          submits: [submit(5, ["right"])],
          reveals: [{ at: at(1), part: "solution" }],
        }),
        now,
      ),
    ).toBeUndefined();
  });

  it("ignores answers that are only empty or unreadable", () => {
    expect(
      observe(
        attempt({ submits: [submit(1, ["unreadable"]), submit(2, ["empty"])] }),
        now,
      ),
    ).toBeUndefined();
    expect(
      observe(
        attempt({ submits: [submit(1, ["empty"]), submit(2, ["right"])] }),
        now,
      ),
    ).toMatchObject({ result: "clean" });
  });

  it("drops an attempt checked against another answer key", () => {
    expect(
      observe(attempt({ submits: [submit(1, ["right"], "k0")] }), now),
    ).toBeUndefined();
  });

  it("counts d5 as d4", () => {
    const hard = { ...submit(1, ["right"]), difficulty: 5 };
    expect(observe(attempt({ submits: [hard] }), now)?.difficulty).toBe(4);
  });

  it("dates an observation in the student's time zone", () => {
    const late = {
      ...submit(0, ["right"]),
      at: Date.parse("2026-10-20T23:30:00Z"),
    };
    expect(observe(attempt({ submits: [late] }), now + 2 * dayMs)?.day).toBe(
      "2026-10-21",
    );
    expect(
      observe(
        attempt({ submits: [late], tz: "America/New_York" }),
        now + 2 * dayMs,
      )?.day,
    ).toBe("2026-10-20");
  });

  it("counts a partly filled answer", () => {
    const result = observe(
      attempt({
        submits: [submit(1, ["right", "empty"])],
        reveals: [{ at: at(2), part: "solution" }],
      }),
      now,
    );
    expect(result).toMatchObject({ result: "fail", credit: 0.2 });
  });

  it("ends the first attempt at the first hour without events", () => {
    const result = observe(
      attempt({ submits: [submit(0, ["wrong"]), submit(70, ["right"])] }),
      now,
    );
    expect(result).toMatchObject({ result: "fail", at: at(0) });
  });

  it("keeps the first attempt going while skips come within the hour", () => {
    const result = observe(
      attempt({
        submits: [submit(0, ["wrong"]), submit(70, ["right"])],
        skips: [at(40)],
      }),
      now,
    );
    expect(result).toMatchObject({ result: "helped", at: at(70) });
  });

  it("doesn't start the first attempt with a skip", () => {
    const result = observe(
      attempt({ submits: [submit(24 * 60, ["right"])], skips: [at(0)] }),
      now + dayMs,
    );
    expect(result).toMatchObject({ result: "clean", at: at(24 * 60) });
  });

  it("cuts the sitting at the policy's gap", () => {
    const result = observe(
      attempt({ submits: [submit(0, ["wrong"]), submit(20, ["right"])] }),
      now,
      { ...defaultPolicy, attemptGapMs: 10 * minuteMs },
    );
    expect(result).toMatchObject({ result: "fail", at: at(0) });
  });

  it("drops an attempt when a later answer was checked against another key", () => {
    expect(
      observe(
        attempt({
          submits: [submit(1, ["wrong"]), submit(3, ["right"], "k0")],
        }),
        now,
      ),
    ).toBeUndefined();
  });

  it("keeps a first right answer clean when a hint is opened after it", () => {
    const result = observe(
      attempt({
        submits: [submit(1, ["right"])],
        reveals: [{ at: at(2), part: "hint1" }],
      }),
      now,
    );
    expect(result).toMatchObject({ result: "clean", credit: 1 });
  });
});
