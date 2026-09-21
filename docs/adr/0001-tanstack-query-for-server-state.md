# 0001. TanStack Query for server state

- Status: accepted
- Date: 2026-09-21

## Context

Almost everything the UI shows comes from the API: employees, feedback, stats and settings. The same data
appears on several screens (the people table, the person page, the combobox of colleagues), and mutations
must refresh every copy. Some actions should feel instant (deleting a person, toggling AI analysis) and roll
back if the server refuses. The first version (v1.0.0) used a generic `useAsync` hook: it tracked loading and
errors and ignored late responses, but had no shared cache, so every screen refetched, and after a mutation
each page patched its own copy with `setData` or reloaded.

## Considered options

1. Keep custom hooks (`useAsync`) and grow them.
2. A global store (Redux Toolkit, Zustand) holding API data.
3. TanStack Query.
4. RTK Query / SWR.

## Decision

TanStack Query 5. Each resource has query keys in `src/api/queryKeys.ts`, and every hook lives in
`src/api/hooks.ts`. Mutations invalidate by key prefix, so all cached lists of a resource refresh. The client
retries network errors and `5xx` at most twice and never retries a `4xx`. Delete and the AI toggle are
optimistic and restore the previous cache on error.

Growing `useAsync` would mean writing a cache, request deduplication, invalidation across screens, retries
and optimistic updates by hand: the library's feature list, without its tests. A global store would hold
server data it doesn't own and still need all that logic. RTK Query would pull in Redux for no other reason; SWR has weaker mutation and optimistic-update support.

## Consequences

- Loading, error, stale and refetch states are consistent across the app, and filter changes keep the previous
  results on screen (`placeholderData`) instead of flashing a skeleton.
- The retry policy and error mapping are tested in one place (`queryClient.test.ts`, `hooks.test.tsx`).
- Contributors need to know the query key conventions; getting a key wrong means a stale screen, not an error.
- One more runtime dependency, and a caching model (stale time, invalidation) to learn.
