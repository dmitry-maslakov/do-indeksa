# 5. One data flow

Server-only functions in `src/server` and `src/content` are the core: they take plain arguments, check the session and ownership themselves and return plain data. Pages, route handlers and actions are thin adapters over them.

Pages read through Server Components; user data renders inside `<Suspense>`. Filters, sort and search live in the URL through nuqs, and the page and its controls share one set of parsers.

Lists that grow on the client, like the bank feed and the task rail, use TanStack Query through a hook. The hook calls a GET route handler under `src/app/api` that parses its input with the same parsers and calls the core. The server renders the first page.

Mutations are next-safe-action actions. Actions never read data: they are POST requests that run one at a time per client and cannot be cached.

No other API style is added. When a second consumer appears, oRPC goes over the same core. External services, gRPC included, are called from the server only.

Task HTML is rendered on demand from the Markdown in the bundle and kept in a byte-bounded LRU cache. Rendered pages are not kept in server memory.

This refines 0001: route handlers exist, but only as GET adapters for reads the client drives.
