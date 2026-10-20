# 4. A test is a session

A test in progress lives in the browser (zustand with localStorage) and, through a debounced action, in its `test_sessions` row as a draft: the answers and every visit to a task. The draft is not graded; it only lets the student continue after a reload or on another device, and a device keeps whichever copy was written last. Unfinished tests stay out of history and statistics.

On finish one action turns each visit into a task session of the test, grades the answers into attempts in the task's last session, clears the draft and sets `finished_at`, in one transaction. The id comes from the client, so a repeated submit is a no-op.

Score is points times the share of correct parts. It is trainer feedback, not an FTN grade.
