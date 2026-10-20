const hourMs = 60 * 60 * 1000;

export const dayMs = 24 * hourMs;

const timeZone = "Europe/Belgrade";

const belgrade = new Intl.DateTimeFormat("en-CA", { timeZone });

export const belgradeDate = (at = new Date()) => belgrade.format(at);
