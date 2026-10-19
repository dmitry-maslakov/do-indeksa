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
pnpm build && pnpm start  # e2e run against a production build, as in CI
pnpm e2e  # BASE_URL defaults to http://localhost:3000
```

e2e runs on desktop (1280) and mobile (390): tag a test `@responsive` for both or `@mobile` for mobile only. Signed-in specs use the `auth` fixture from `e2e/fixtures.ts` and skip unless `DATABASE_URL` and `BETTER_AUTH_SECRET` are exported. Each test sends its own `cf-connecting-ip`, so the auth rate limit treats tests as separate clients.

## Layout

- `content/` sample topics, exam, tasks and tests. Production content is built in from a separate bank via `CONTENT_DIR`.
- `messages/` UI strings for `sr-Latn`, `ru` and `en`.
- `src/app` routes; UI used by one route sits in its `_components`.
- `src/features/<feature>` everything one feature owns: server-only services, `*-action.ts` server actions, components, `use-*.ts` hooks and its constants.
- `src/components` app shell and shared UI, `src/lib` helpers without domain knowledge, `src/server` database, env, auth and the safe action clients.
- `docs/decisions` short architecture decisions.

## License

Code is released under the MIT License. Content in `content/` is released under CC BY-NC-SA 4.0.
