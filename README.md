# Do indeksa

Free entrance exam preparation for Serbian high school graduates: a task bank with hints and solutions, timed practice tests, a weekly variant, run review and statistics. The first exam is FTN P1 mathematics.

Live at [doindeksa.rs](https://doindeksa.rs). [Srpski](README.sr.md)

## Run locally

Requires Node 24, pnpm and Docker.

```sh
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Google sign-in needs real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in place of the `local` placeholders; everything else works as a guest without them.

## Checks

```sh
pnpm lint && pnpm typecheck && pnpm knip && pnpm i18n && pnpm test
pnpm build && pnpm start  # e2e run against a production build, as in CI
pnpm e2e  # BASE_URL defaults to http://localhost:3000
k6 run load/visit.js  # BASE_URL, USERS (20), LAUNCH_COOKIE behind the launch gate
```

e2e runs on desktop (1280) and mobile (390): tag a test `@responsive` for both or `@mobile` for mobile only. Signed-in specs use the `auth` fixture from `e2e/fixtures.ts` and skip unless `DATABASE_URL` and `BETTER_AUTH_SECRET` are exported. Each test sends its own `cf-connecting-ip`, so the auth rate limit treats tests as separate clients. The suite has to pass on the public `content/`, without `CONTENT_DIR`.

The [k6](https://k6.io) load test walks visitors through the home page, theory, the bank and the tests for about three minutes and fails when a page's p95 passes 300 ms or its p99 500 ms. `K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=load-report.html` saves an HTML report.

## Layout

[ARCHITECTURE.md](ARCHITECTURE.md) maps the code and lists the rules it relies on.

## License

Code is released under the MIT License. Content in `content/` is released under CC BY-NC-SA 4.0.
