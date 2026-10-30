import { describe, expect, it, vi } from "vitest";
import { eraseAnalytics, openPanelDelete } from "./analytics-erasure";

interface Request {
  query: string;
  query_params?: Record<string, unknown>;
}

describe("openPanelDelete", () => {
  it.each([
    [["profile_id"], "profile_id IN {ids:Array(String)}"],
    [["id"], "id IN {ids:Array(String)}"],
    [
      ["id", "profile_id"],
      "id IN {ids:Array(String)} OR profile_id IN {ids:Array(String)}",
    ],
  ])("deletes the rows that hold %j", (columns, where) => {
    expect(openPanelDelete({ table: "events", columns })).toBe(
      `ALTER TABLE openpanel.{table:Identifier} DELETE WHERE ${where}`,
    );
  });
});

describe("eraseAnalytics", () => {
  const answers = [
    [{ id: "guest" }],
    [{ aid: "a1" }],
    [
      { table: "profiles", columns: ["id"] },
      { table: ".inner_id.1", columns: ["profile_id"] },
    ],
  ];
  const client = {
    query: vi.fn(async (_: Request) => ({ json: async () => answers.shift() })),
    command: vi.fn(async (_: Request) => {}),
  };
  const params = ({ mock }: typeof client.query | typeof client.command) =>
    mock.calls.map(([request]) => request.query_params);

  it("deletes the profiles, the guests merged into them and their devices", async () => {
    expect(await eraseAnalytics(client as never, ["p1"])).toEqual({
      profiles: 2,
      devices: 1,
    });
    expect(params(client.query)).toEqual([
      { ids: ["p1"] },
      { ids: ["p1", "guest"] },
      undefined,
    ]);
    expect(params(client.command)).toEqual([
      { ids: ["p1", "guest"], aids: ["a1"] },
      { table: "profiles", ids: ["p1", "guest", "a1"] },
      { table: ".inner_id.1", ids: ["p1", "guest", "a1"] },
    ]);
    expect(client.command).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining("ALTER TABLE analytics.events"),
        clickhouse_settings: { mutations_sync: "1" },
      }),
    );
  });
});
