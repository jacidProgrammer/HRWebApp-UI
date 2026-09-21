# 0003. A demo mode backed by Mock Service Worker

- Status: accepted
- Date: 2026-09-21

## Context

Seeing the app normally needs the backend, PostgreSQL or H2, and Keycloak with an imported realm. That is too
much for someone evaluating the project from a link, and too slow and flaky for end-to-end tests in CI. The
tests also need deterministic data (the dashboard alert, the counts on the person page).

## Considered options

1. Run the real backend and Keycloak in CI (docker compose) and have no public demo.
2. Stub responses per test with Playwright's `page.route`.
3. A demo mode: a role picker instead of Keycloak, and a fake API in the browser implemented with Mock Service
   Worker (MSW), used both for the public demo and for the e2e tests.

## Decision

Option 3. `AUTH_MODE=mock` (or `VITE_AUTH_MODE=mock`, or `vite --mode mock`) swaps the Keycloak provider for a
role picker and starts MSW handlers (`src/mocks/`) that implement the API contract: role checks, validation
errors, the `409` for a duplicate username, anonymity rules and the stats computation, over a seeded,
deterministic dataset kept in `sessionStorage`. If the browser refuses the service worker, the same handlers
answer through an in-page Axios adapter. The code is lazy-loaded, so a normal build never downloads it.

The e2e suite runs against the production build in this mode, and the GitHub Pages demo is the same build under
`/HRWebApp-UI/`. `?as=manager` or `?as=jose` opens the demo already signed in.

Stubbing per test (option 2) duplicates the contract in every spec and can't power a public demo. Running the
real stack (option 1) tests more, but belongs to the backend repository, which has its own integration tests.

## Consequences

- A public, zero-install demo and fast, deterministic e2e tests from one implementation.
- The handlers are a second implementation of the contract and can drift from the backend. The generated
  OpenAPI types (ADR 0006) make field-level drift a compile error; behaviour still has to be kept in step.
- Demo mode must never be on by accident: it needs an explicit flag and always shows a banner.
