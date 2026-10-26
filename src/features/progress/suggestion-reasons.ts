export const suggestionReasons = [
  "first",
  "stuck",
  "next",
  "almost",
  "started",
  "done",
] as const;

export type SuggestionReason = (typeof suggestionReasons)[number];
