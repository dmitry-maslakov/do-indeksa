# Architecture

Do indeksa is one Next.js app. Pages render on the server and call feature code directly, writes go through server actions, and the few reads the client drives go through GET route handlers. Postgres holds only what students do. Topics, exams, tasks, variants and theory are Markdown files compiled into the build.

Filters, sort and search live in the URL through nuqs. Lists that grow on the client, the bank feed and the test history, fetch further pages with TanStack Query from a route handler that parses its input with the same parsers as the page, and the server renders the first page.

## Code map

`content/` is a small public sample. Production builds read the private bank instead, through `CONTENT_DIR`, and content-collections validates both against the schemas in `content-collections.ts`. Theory is `theory/<topic>/index.md` with `##` sections plus `theory/<topic>/methods/<slug>.md`, and uses the blocks `:::remember`, `:::example`, `:::mistake` and `:::formulas`. Each topic lists its task types in `types` and every task names one in `type`: the slug of the method that is the key to solving it, or a kind of task that no method covers.

`messages/` has the UI strings for `sr-Latn`, `ru` and `en`.

`src/app` holds routes. A `page.tsx` sets metadata, layout and Suspense boundaries, and whatever loads or renders data for one route sits next to it in `_components`. The app shell, with navigation and footer, is in `(app)/_components/shell`. Pages sit in route groups by how much of it they show on a phone: `(site)` all of it, `(read)` theory topics without the header, `(task)` a task and `(exam)` a test with neither the header nor the bottom bar. Each group's layout renders the shell for its mode, so the server sends the final chrome. `src/app/api` has route handlers for auth, the bank feed, the test history, task reveals and the health check.

`src/features` has the product code. Each folder owns its server code, one `actions.ts`, its components and its hooks:

- `catalog` reads content: exams, topics, tasks and the answer checker.
- `progress` turns attempts into task status, topic progress and statistics.
- `practice` is working on one task: the answer field, hints and solutions, task sessions, favorites and reports.
- `bank` is the task list with filters, search and the queue of what to solve next.
- `variants` lists exam variants, the weekly one and variants composed from chosen topics.
- `tests` runs a variant as a test, grades it and shows the review.
- `theory` renders theory pages.
- `account` is Google sign-in, the prompts that ask a guest to save their progress, and merging a guest into an account.
- `launch` keeps the site closed before launch: without the access cookie only the landing, privacy and terms pages open.

`catalog` imports no other feature. `progress` builds on `catalog`, `practice` on both, `bank` on all three. `variants` builds on `catalog`, `tests` on `variants` and `practice`, `account` on `tests`. Biome rejects an import that goes the other way.

`src/components` is UI shared by several features, with shadcn in `components/ui`. `src/lib` is helpers that know nothing about exams or students. `src/db` has the Drizzle schema, the column types and the migrate and cleanup scripts. `src/server` is infrastructure: the database client, env, auth, the current profile and the action clients. None of these import features or routes.

## Invariants

Nothing checks these automatically.

### Answers stay on the server

A task page gets the statement and the part labels. A server action checks answers with Compute Engine. The page fetches hints, the key and the solution one at a time from `/api/tasks/[id]/reveal` when the student opens them, and an action saves each opening as a reveal.

### Everything belongs to a profile

A profile is the student, and the better-auth user is only how they sign in. Task and test sessions, attempts, reveals, skips, favorites, suggestions and reports all point at `profiles.id`. A guest gets a profile on their first action, keyed by a random token in an httpOnly `__Host-profile` cookie whose hash is stored. That cookie never opens a profile that has a user.

Feature functions take the profile id as an argument and scope every query to it. The id comes from `src/server/profile.ts`, from the session or the cookie, never from request input.

When someone signs in while holding a guest cookie, the account takes over the guest profile. If the account already has a profile, the guest's sessions, favorites, reports and suggestions move into it and the guest profile is deleted. Session foreign keys cascade on update, so attempts, reveals and skips follow their sessions. A scheduled job deletes guest profiles idle for 30 days, or for 400 days if they have attempts, favorites or tests.

### A sitting on a task is a task session

The server keeps task sessions. While the page is visible it pings every 30 seconds. A ping, attempt or reveal within 45 seconds of the previous signal extends the session, so one late ping doesn't split a sitting; a later one opens a new session. Time on a task is `last_seen_at − started_at` on the database clock.

In practice a session is `first` until the task has an attempt or a reveal and an hour has passed since the last attempt, reveal or skip on it; after that it is `retry`. A reload or a short break doesn't count as a second try. In a test it is `mock`. Each attempt stores the task's difficulty, a hash of its key and the checker version, so results can be recomputed when content or grading changes. The action client refuses crawlers by User-Agent, so they never get a profile.

### A test is a draft until it is finished

A running test lives in the browser (zustand with localStorage) and is saved as a draft in its `test_sessions` row, so it survives a reload or a switch to another device. The draft is never graded and stays out of history and statistics.

Finishing is one transaction: each visit to a task becomes a `mock` task session, the answers are graded into attempts, the draft is cleared and `finished_at` is set. The client picks the test id, so a second submit changes nothing. The score is points times the share of correct parts. It is practice feedback and says nothing about how FTN would grade the same work.

### Task ids never change

Attempts refer to task ids, so CI fails a pull request that renames or deletes a file under `content/tasks`.

Pull requests build and test with the public `content/`. Builds of `main`, including the hourly one, bake in the bank's `main`. The bank's CI validates it against the app's `main`, so a change to the content format lands in the app first, together with `content/`, and then in the bank. Until the bank catches up, builds of `main` fail and production keeps the previous image.
