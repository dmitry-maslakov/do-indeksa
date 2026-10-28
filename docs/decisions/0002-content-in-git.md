# 2. Content in git, user data in Postgres

Topics, exams, tasks and tests are Markdown and YAML, validated and rendered at build time by content-collections. Postgres stores only users, attempts, runs and favorites.

The production bank lives in a private repository and is built into the image with `CONTENT_DIR`. Task ids are immutable; CI rejects renames and deletions.

Pull requests are built and tested on the public `content/`. Only builds of `main`, including the hourly one, bake in the bank's `main`. The bank's CI validates it against the app's `main`, so a format change lands in the app first, together with `content/`, and then in the bank. Until the bank follows, builds of `main` fail and production keeps the previous image.
