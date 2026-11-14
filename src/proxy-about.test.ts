import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import proxy from "./proxy";

vi.mock("@/features/catalog/exams", async (original) => ({
  ...(await original()),
  aboutPaths: [],
}));

it("sends an open exam without an about page to the not found page", async () => {
  const response = await proxy(
    new NextRequest(new URL("/ru/ftn/p1/about", "https://doindeksa.rs")),
  );
  expect(response.headers.get("x-middleware-rewrite")).toBe(
    "https://doindeksa.rs/ru/404",
  );
});
