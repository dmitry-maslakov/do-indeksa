import { attempt } from "es-toolkit";
import { z } from "zod";
import { dayMs } from "./dates";

export interface EventDefinition {
  name: string;
  props: z.ZodType<Record<string, unknown>>;
}

export type EventMap<Events extends readonly EventDefinition[]> = {
  [Event in Events[number] as Event["name"]]: z.input<Event["props"]>;
};

export type ParsedEvent = { name: string; props: Record<string, unknown> };

const textLimit = 200;
const batchLimit = 50;

export const text = z.string().overwrite((value) => value.slice(0, textLimit));

export const defineEvent = <
  const Name extends string,
  Shape extends z.ZodRawShape,
>(
  name: Name,
  shape: Shape,
) => ({ name, props: z.strictObject(shape) });

const page = z.object({
  path: z
    .string()
    .regex(/^\/(?!\/)/)
    .max(1000),
  referrer: z.url().max(textLimit).optional(),
  ago: z.int().min(0).max(dayMs),
});

const batch = z.object({
  id: z.uuid(),
  events: z.array(z.looseObject({})).min(1).max(batchLimit),
});

export type BrowserEvent = ParsedEvent & z.output<typeof page>;

export function batchParser(events: readonly EventDefinition[]) {
  const schemas = new Map(events.map(({ name, props }) => [name, props]));
  return (body: string) => {
    const parsed = batch.safeParse(attempt(() => JSON.parse(body))[1]);
    if (!parsed.success) return;
    return {
      id: parsed.data.id,
      events: parsed.data.events.flatMap(({ name, props, ...rest }) => {
        const valid = schemas.get(String(name))?.safeParse(props);
        const meta = page.safeParse(rest);
        return valid?.success && meta.success
          ? [{ name: String(name), props: valid.data, ...meta.data }]
          : [];
      }),
    };
  };
}
