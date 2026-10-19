# 3. Answers stay on the server

Pages send statements and part labels only. Answers are checked by a Server Action with Compute Engine, and hints, the key and the solution load on demand through another action. Guests can solve and check; history needs sign-in.

Hints, the key and the solution now load through a GET route handler, see 0005.
