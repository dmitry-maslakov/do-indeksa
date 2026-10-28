export const secondMs = 1000;

export const minuteMs = 60 * secondMs;

export const hourMs = 60 * minuteMs;

export const dayMs = 24 * hourMs;

export const daySeconds = dayMs / secondMs;

export const toMinutes = (ms: number) => Math.round(ms / minuteMs);

const timeZone = "Europe/Belgrade";

const belgrade = new Intl.DateTimeFormat("en-CA", { timeZone });

export const belgradeDate = (at = new Date()) => belgrade.format(at);
