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

Google sign-in needs real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in place of the `local` placeholders; everything else works as a guest without them.

## Checks

```sh
pnpm lint && pnpm typecheck && pnpm knip && pnpm i18n && pnpm test
pnpm build && pnpm start  # e2e run against a production build, as in CI
pnpm e2e  # BASE_URL defaults to http://localhost:3000
```

e2e runs on desktop (1280) and mobile (390): tag a test `@responsive` for both or `@mobile` for mobile only. Signed-in specs use the `auth` fixture from `e2e/fixtures.ts` and skip unless `DATABASE_URL` and `BETTER_AUTH_SECRET` are exported. Each test sends its own `cf-connecting-ip`, so the auth rate limit treats tests as separate clients. The suite has to pass on the public `content/`, without `CONTENT_DIR`.

## Layout

- `content/` sample topics, exam, tasks, tests and theory. Production content is built in from a separate bank via `CONTENT_DIR`. Theory is `theory/<topic>/index.md` with `##` sections and `theory/<topic>/methods/<slug>.md`, with the blocks `:::remember`, `:::example`, `:::mistake` and `:::formulas`.
- `messages/` UI strings for `sr-Latn`, `ru` and `en`.
- `src/app` routes; UI used by one route sits in its `_components`, and the `(app)` shell (navigation, footer, query provider) in `(app)/_components/shell`.
- `src/features/<feature>` everything one feature owns: server-only services, server actions in `actions.ts`, components, `use-*.ts` hooks and its constants; a large feature groups its UI in subfolders. Features import each other one way only (`catalog` ← `progress` ← `practice` ← `bank`, `catalog` ← `variants` ← `tests`), and Biome checks it.
- `src/components` UI shared across routes and `src/lib` helpers without domain knowledge; neither imports features. `src/db` holds the schema and the column values, `src/server` the database client, env, auth, profile and the safe action clients.
- `docs/decisions` short architecture decisions.

## License

Code is released under the MIT License. Content in `content/` is released under CC BY-NC-SA 4.0.
