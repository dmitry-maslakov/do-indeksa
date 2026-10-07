# 4. Runs are written once

A test in progress lives in the browser (zustand with localStorage), so a reload keeps it. On finish one action grades it and, for a signed-in user, inserts the run and its answered attempts in one transaction. The run id comes from the client, so a repeated submit is a no-op.

Score is points times the share of correct parts. It is trainer feedback, not an FTN grade.
