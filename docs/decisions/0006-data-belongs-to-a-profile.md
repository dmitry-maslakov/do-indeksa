# 6. Data belongs to a profile

A profile is the student: attempts, runs, the unfinished run, favorites, reveals and reports point at `profiles.id`. The auth `user` only signs in; a profile has at most one user and may have none.

A signed-in user gets a profile the first time one is looked up. A guest gets one on the first action that saves something, identified by a random token in an httpOnly `__Host-` cookie whose hash is stored. The cookie opens only a profile without a user; a linked profile opens only with the session.

On sign-in a guest profile is linked to a new user, or merged into the account's profile and deleted, and the student is told. Signing out clears the profile cookie.

Services take the profile id from the server, from the session or the cookie, never from input, and scope every query to it. Deleting a user deletes the profile and its data.
