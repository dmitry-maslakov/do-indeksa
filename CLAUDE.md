# Do indeksa — project rules

Free platform for Serbian high school graduates preparing for university entrance exams: task bank with solutions, exam variants, daily variant, mistake review, statistics. MVP: FTN P1 mathematics.

## Languages

- Communication with Claude: Russian.
- Code, commits, identifiers, routes: English.
- UI strings live in next-intl catalogs, never hardcoded: `sr-Latn` default, `ru`, `en`.
- Task content: Serbian latin script, as on the real exam.

## Stack

- Single Next.js app (App Router, TypeScript). No separate backend service.
- better-auth (Google), Drizzle + Postgres (Neon), next-intl.
- Content: content-collections, KaTeX at build time. Answers: MathLive input, Compute Engine checking on the server.
- UI: shadcn/ui (Base UI) + Tailwind themed with the design tokens. Zustand only for the exam runner.
- Tooling: pnpm, Biome, Vitest, Playwright.
- Content lives in git as Markdown + YAML frontmatter in `content/`, not in the database. The database holds user data only.
- Prefer established libraries over hand-written code. Keep the codebase small.

## Exam facts

- FTN P1: 10 tasks, 4 hours, at most 60 points. Exams and faculties are data records; adding one must not change the UI.
- FTN grades the shown method with partial credit; answer checks are trainer feedback, not official scoring. Never promise admission or predict scores.

## Git workflow

- `main` only through pull requests; one small task per issue, branch and PR.
- Branches: `type/<issue>-short-slug`, e.g. `feat/12-answer-field`, `fix/15-timer-reset`.
- Conventional Commits, atomic, imperative lowercase: `feat|fix|refactor|test|docs|chore|ci|content(scope): ...`.
- Rebase merge only; the branch is deleted after merge.
- No AI attribution in commits, PRs or contributors.

## Code and docs

- No comments in code. Docs contain facts, decisions and instructions only.

## Copyright

- Never commit original FTN/ETF exam PDFs or the OCR'd FTN priručnik. Link to official sources and keep our own metadata only.
- Our authored tasks and solutions are published freely.

## Licenses

- Code: MIT. Content (`content/`): CC BY-NC-SA 4.0.
