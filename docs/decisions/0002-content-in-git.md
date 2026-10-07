# 2. Content in git, user data in Postgres

Topics, exams, tasks and tests are Markdown and YAML, validated and rendered at build time by content-collections. Postgres stores only users, attempts, runs and favorites.

The production bank lives in a private repository and is built into the image with `CONTENT_DIR`. Task ids are immutable; CI rejects renames and deletions.
