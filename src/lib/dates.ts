export const DAY = 24 * 60 * 60 * 1000;

const belgrade = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

export const belgradeDate = (at = new Date()) => belgrade.format(at);
