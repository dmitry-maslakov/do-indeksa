# 7. A sitting is a task session

One continuous visit to a bank task is a task session, kept only by the server. The page sends a keep-alive every 30 seconds while visible, and every attempt and reveal carries the session id it last got back. Within 45 seconds of the last signal the server extends the session; after a longer pause it opens a new one and returns its id. Time on a task is `last_seen_at − started_at`, on the database clock.

Attempts and reveals always belong to a task session; in a test every visit to a task is one, linked to its test session. Events keep only their creation time.

A session without an attempt means the task was seen; the queue offers tasks never seen first, then the ones seen longest ago. Crawlers are refused by User-Agent (`isbot`) in the action client, so they get no profile or session.
