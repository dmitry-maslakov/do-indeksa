const legacyTopics = {
  "kompleksni-brojevi": "complex-numbers",
  "kvadratna-jednacina": "quadratic-equations",
  logaritmi: "logarithms",
  eksponencijalne: "exponential-equations",
  trigonometrija: "trigonometry",
  "vektori-analitika": "vectors-analytic-geometry",
  planimetrija: "plane-geometry",
  stereometrija: "solid-geometry",
  "analiza-funkcije": "functions-integrals",
  kombinatorika: "combinatorics",
};

export const legacyPages = [
  { source: "/tasks/:topic/:id", destination: "/bank/:id" },
  ...Object.entries(legacyTopics).map(([slug, topic]) => ({
    source: "/tasks",
    has: [{ type: "query" as const, key: "topic", value: slug }],
    destination: `/bank/topic/${topic}`,
  })),
  { source: "/(tasks|training)/:path*", destination: "/bank" },
  { source: "/exams/:exam(ftn-p1)?", destination: "/variants" },
  { source: "/(diagnostic|simulation)/:path*", destination: "/variants" },
  { source: "/history/:path*", destination: "/variants?tab=history" },
  { source: "/cabinet", destination: "/stats" },
  { source: "/prep", destination: "/" },
];
