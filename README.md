# Do indeksa

Free entrance exam preparation for Serbian high school graduates: a task bank with hints and solutions, timed practice tests, a daily test, run review and statistics. The first exam is FTN P1 mathematics.

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

Google sign-in needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; everything else works as a guest without them.

## Checks

```sh
pnpm lint && pnpm typecheck && pnpm knip && pnpm i18n && pnpm test
pnpm e2e  # against a running app, BASE_URL defaults to http://localhost:3000
```

## Layout

- `content/` sample topics, exam, tasks and tests. Production content is built in from a separate bank via `CONTENT_DIR`.
- `messages/` UI strings for `sr-Latn`, `ru` and `en`.
- `src/app` routes, `src/components` UI, `src/content` content queries, `src/lib` pure logic, `src/server` database, auth and server actions.
- `docs/decisions` short architecture decisions.

## License

Code is released under the MIT License. Content in `content/` is released under CC BY-NC-SA 4.0.
