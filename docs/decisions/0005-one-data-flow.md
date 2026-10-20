# 5. One data flow

Code has three layers:

- Adapters: pages, route handlers and `*-action.ts` files. They parse input, take the profile from `getProfileId()` and call a service. They never import the database or Drizzle; Biome enforces it.
- Services: server-only functions in `src/features/*`. They take plain arguments, the profile id included, scope every query to that profile, run the Drizzle queries and transactions and return plain data.
- Pure functions without I/O hold the domain logic and carry the unit tests.

There is no repository layer: Drizzle already is the typed query layer, and tests that need the database run against Postgres.

Pages read through Server Components; user data renders inside `<Suspense>`. Filters, sort and search live in the URL through nuqs, and the page and its controls share one set of parsers.

Lists that grow on the client, like the bank feed and the task rail, use TanStack Query through a hook. The hook calls a GET route handler under `src/app/api` that parses its input with the same parsers and calls a service. The server renders the first page.

Mutations are next-safe-action actions in `*-action.ts` files. Actions don't serve reads and return only the result of their own write: they are POST requests that run one at a time per client and cannot be cached. An unexpected error reaches the client only as a code, `unexpected` or `unauthorized`; the texts live in `use-error-text`.

No other API style is added. When a second consumer appears, oRPC goes over the same services. External services, gRPC included, are called from the server only.

Task HTML is rendered on demand from the Markdown in the bundle and kept in a byte-bounded LRU cache. Rendered pages are not kept in server memory.

This refines 0001: route handlers exist, but only as GET adapters for reads the client drives.
