# 1. One Next.js app

The site is a single Next.js app on the App Router. Pages read data on the server, writes go through Server Actions, and there is no separate API. Auth is better-auth with Google, data lives in Postgres through Drizzle.

A Go API with GraphQL was dropped: two services and a schema layer were too much code for a few reads and three writes.
