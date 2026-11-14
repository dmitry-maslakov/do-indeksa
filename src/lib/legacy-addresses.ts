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

const p1 = "/ftn/p1";

interface LegacyPage {
  source: string;
  has?: { type: "query"; key: string; value: string }[];
  destination: string;
}

export const legacyPages: LegacyPage[] = [
  {
    source: "/bank",
    has: [{ type: "query", key: "topic", value: "(?<topic>[^&]+)" }],
    destination: `${p1}/bank/topic/:topic`,
  },
  ...["/bank", "/variants", "/theory", "/review"].map(
    (section): LegacyPage => ({
      source: `${section}/:path*`,
      destination: `${p1}${section}/:path*`,
    }),
  ),
  { source: "/stats", destination: `${p1}/stats` },
  { source: "/v/:code", destination: `${p1}/v/:code` },
  { source: "/tasks/:topic/:id", destination: `${p1}/bank/:id` },
  ...Object.entries(legacyTopics).map(
    ([slug, topic]): LegacyPage => ({
      source: "/tasks",
      has: [{ type: "query", key: "topic", value: slug }],
      destination: `${p1}/bank/topic/${topic}`,
    }),
  ),
  { source: "/(tasks|training)/:path*", destination: `${p1}/bank` },
  {
    source: "/exams/:exam(ftn-p1)",
    destination: `${p1}/about`,
  },
  { source: "/(exams|calculator)", destination: "/ftn" },
  { source: "/faculties/ftn", destination: "/ftn" },
  { source: "/(diagnostic|simulation)/:path*", destination: `${p1}/variants` },
  { source: "/history/:path*", destination: `${p1}/variants?tab=history` },
  { source: "/cabinet", destination: `${p1}/stats` },
  { source: "/prep", destination: p1 },
  { source: "/launch", destination: "/" },
];
