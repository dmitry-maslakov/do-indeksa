# 7. A sitting is a task session

One visit to a bank task is a task session: the page makes its id and start time and stores it once loaded. Attempts and reveals on that page belong to it; on the test review they belong to the run. Each row has exactly one owner, enforced by the database.

A session without an attempt means the task was seen; the queue offers tasks never seen first, then the ones seen longest ago.

Crawlers are told apart by User-Agent (`isbot`) in the action client, so no action gives them a profile or a session.
