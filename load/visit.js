import { check, group, sleep } from "k6";
import http from "k6/http";

const base = __ENV.BASE_URL || "http://localhost:3000";
const access = __ENV.LAUNCH_COOKIE;
const users = Number(__ENV.USERS || 20);

const budget = ["p(95)<300", "p(99)<500"];
const pages = [
  "home",
  "theory",
  "topic",
  "bank",
  "task",
  "variants",
  "variant",
];

export const options = {
  scenarios: {
    visitors: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: users },
        { duration: "2m", target: users },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    ...Object.fromEntries(
      pages.map((page) => [`http_req_duration{page:${page}}`, budget]),
    ),
  },
  summaryTrendStats: ["med", "p(95)", "p(99)", "max"],
};

const params = (page) => ({
  tags: { page },
  headers: { "Accept-Encoding": "gzip" },
  cookies: access ? { "launch-access": access } : {},
  redirects: 0,
});

const links = (html, pattern) => [
  ...new Set(Array.from(html.matchAll(pattern), (match) => match[1])),
];

export function setup() {
  const crawl = (path, pattern) => {
    const found = links(
      http.get(`${base}${path}`, params("setup")).body,
      pattern,
    );
    if (!found.length)
      throw new Error(`no links matching ${pattern} on ${path}`);
    return found;
  };
  return {
    topics: crawl("/theory", /href="(\/theory\/[a-z0-9-]+)"/g),
    tasks: crawl("/bank", /href="(\/bank\/[a-z0-9-]+)"/g),
    variants: crawl("/variants", /href="(\/variants\/[a-z0-9-]+)"/g),
  };
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function visit(page, path) {
  const response = http.get(`${base}${path}`, params(page));
  check(response, { [`${page} is 200`]: (r) => r.status === 200 });
  sleep(1 + Math.random() * 2);
}

export default function ({ topics, tasks, variants }) {
  group("read theory", () => {
    visit("home", "/");
    visit("theory", "/theory");
    visit("topic", pick(topics));
  });
  group("practice", () => {
    visit("bank", "/bank");
    visit("task", pick(tasks));
    visit("task", pick(tasks));
  });
  group("take a test", () => {
    visit("variants", "/variants");
    visit("variant", pick(variants));
  });
}
