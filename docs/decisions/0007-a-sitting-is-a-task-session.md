# 7. A sitting is a task session

One continuous visit to a bank task is a task session, kept only by the server. The page sends a keep-alive every 30 seconds while visible, and every attempt and reveal carries the session id it last got back. Within 45 seconds of the last signal the server extends the session; after a longer pause it opens a new one and returns its id. Time on a task is `last_seen_at − started_at`, on the database clock.

Attempts, reveals and skips always belong to a task session; in a test every visit to a task is one, linked to its test session. Events keep only their creation time.

A session records its kind and the time zone the page sends with the keep-alive. In a test it is `mock`. In practice it is `first` until the task has an attempt or a reveal and an hour has passed since its last attempt, reveal or skip, then `retry`: sittings less than an hour apart are one attempt at the task. The hour is measured on the database clock. Each attempt keeps the task's difficulty, a hash of its answer key and the checker version it was graded with, so results can be recomputed or dropped when content or grading changes.

A session without an attempt means the task was seen; the queue offers tasks never seen first, then the ones seen longest ago. Crawlers are refused by User-Agent (`isbot`) in the action client, so they get no profile or session.
