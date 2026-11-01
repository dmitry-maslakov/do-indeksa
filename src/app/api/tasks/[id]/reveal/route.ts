import type { NextRequest } from "next/server";
import { z } from "zod";
import { renderReveal } from "@/features/practice/reveal/reveals";

const partSchema = z.union([
  z.enum(["answer", "solution"]),
  z.enum(["0", "1", "2"]).transform(Number),
]);

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/tasks/[id]/reveal">,
) {
  const part = partSchema.safeParse(request.nextUrl.searchParams.get("part"));
  if (!part.success) return new Response(null, { status: 400 });
  const reveal = await renderReveal((await params).id, part.data);
  if (reveal === null) return new Response(null, { status: 404 });
  return Response.json(reveal);
}
