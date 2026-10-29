export const secondMs = 1000;

export const minuteMs = 60 * secondMs;

export const hourMs = 60 * minuteMs;

export const dayMs = 24 * hourMs;

export const daySeconds = dayMs / secondMs;

export const toMinutes = (ms: number) => Math.round(ms / minuteMs);

const timeZone = "Europe/Belgrade";

const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function dateIn(at: Date | number, zone?: string | null) {
  const key = zone ?? timeZone;
  const format =
    dateFormats.get(key) ?? new Intl.DateTimeFormat("en-CA", { timeZone: key });
  dateFormats.set(key, format);
  return format.format(at);
}

export const belgradeDate = (at = new Date()) => dateIn(at);
