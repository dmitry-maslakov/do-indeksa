# 6. Data belongs to a profile

A profile is the student: test sessions, task sessions, attempts, reveals, favorites and reports point at `profiles.id`. The auth `user` only signs in; a profile has at most one user and may have none.

A signed-in user gets a profile the first time one is looked up. A guest gets one on the first action, which opening a task already is, identified by a random token in an httpOnly `__Host-` cookie whose hash is stored. The cookie opens only a profile without a user; a linked profile opens only with the session.

On the first page after sign-in, when both the session and a guest cookie are present, an action links the guest profile to the user or moves its sessions, favorites and reports into the account's profile and deletes it, then clears the cookie; the student is told when both had progress. Session foreign keys cascade on update, so moving sessions moves their attempts and reveals. Guest profiles left empty are removed by a scheduled job.

Services take the profile id from the server, from the session or the cookie, never from input, and scope every query to it. Deleting a user deletes the profile and its data.
