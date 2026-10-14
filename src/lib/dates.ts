export const DAY = 24 * 60 * 60 * 1000;

export const TIME_ZONE = "Europe/Belgrade";

const belgrade = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export const belgradeDate = (at = new Date()) => belgrade.format(at);
