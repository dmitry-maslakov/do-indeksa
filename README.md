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

e2e runs on desktop (1280) and mobile (390): tag a test `@responsive` for both or `@mobile` for mobile only. Signed-in specs use the `auth` fixture from `e2e/fixtures.ts` and skip unless `DATABASE_URL` and `BETTER_AUTH_SECRET` are exported.

## Layout

- `content/` sample topics, exam, tasks and tests. Production content is built in from a separate bank via `CONTENT_DIR`.
- `messages/` UI strings for `sr-Latn`, `ru` and `en`.
- `src/app` routes; UI used by one route sits in its `_components`.
- `src/features/<feature>` everything one feature owns: server-only core, `*-action.ts` server actions, components, `use-*.ts` hooks and its constants.
- `src/components` app shell and shared UI, `src/lib` helpers without domain knowledge, `src/server` database, env and auth.
- `docs/decisions` short architecture decisions.

## License

Code is released under the MIT License. Content in `content/` is released under CC BY-NC-SA 4.0.
