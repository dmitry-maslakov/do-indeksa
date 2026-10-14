# 4. Runs are written once

A test in progress lives in the browser (zustand with localStorage), so a reload keeps it, and runs started more than a day ago are dropped when the store loads; for a signed-in user a debounced action also keeps the latest-written run in one row per user, so another device can continue it; a device keeps whichever copy was written last, and finishing deletes that row. On finish one action grades it and, for a signed-in user, inserts the run and its answered attempts in one transaction. The run id comes from the client, so a repeated submit is a no-op.

Score is points times the share of correct parts. It is trainer feedback, not an FTN grade.
