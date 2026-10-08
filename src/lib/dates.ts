export const DAY = 24 * 60 * 60 * 1000;

export const belgradeDate = (at = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade" }).format(at);
