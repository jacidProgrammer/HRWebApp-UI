# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-21

A redesign around peer recognition and manager insights, for version 2 of the HR API.

### Added

- **Manager dashboard**: headcount, feedback this month with the change from last month, share of positive
  feedback and departments; a stacked sentiment trend over 3, 6 or 12 months (accessible SVG with a table
  fallback); value distribution; the five most recognised people; alerts when positive feedback about someone
  drops.
- **People**: a sortable table with search and department filters kept in the URL; person pages with details,
  a sentiment summary and the feedback about them, five at a time with *Show more*.
- **Feedback explorer**: filter all feedback by department, person, sentiment and date range (in the URL),
  paged 20 at a time.
- **Recognition for employees**: received and sent tabs, a give-recognition form with an accessible colleague
  combobox, company values, anonymous sending, a live preview and a notice about AI analysis.
- **Settings**: turn AI sentiment analysis on or off for the whole organisation.
- **Date field** that shows and reads dates in the app's language (`21/09/2026`, `21.09.2026`) whatever the
  browser's locale, with typed input, validation and a keyboard-accessible calendar (WAI-ARIA date picker
  dialog pattern).
- App shell with a collapsible sidebar (a drawer on phones), light, dark and system themes, and English,
  Spanish and German (formal *Sie*).
- **Demo mode** (`npm run dev:mock`, `AUTH_MODE=mock`): a role picker and an in-browser mock API built with
  Mock Service Worker, with an in-page fallback when service workers are unavailable. `?as=manager` or
  `?as=jose` opens it signed in.
- **Public demo on GitHub Pages** at <https://jacidprogrammer.github.io/HRWebApp-UI/>, deployed by
  `.github/workflows/pages.yml`. The app is base-path aware (router, service worker, assets, `config.js`),
  and deep links work through a `404.html` copy of the app shell.
- **API types generated from the backend's OpenAPI document** (`npm run api:types`, openapi-typescript), with
  the spec and the types committed, and an `api-contract` CI job that detects drift from the backend.
- **nginx hardening** in the Docker image: a Content-Security-Policy generated at start-up from the configured
  API and Keycloak origins, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options`, `Cross-Origin-Opener-Policy`, optional HSTS (`ENABLE_HSTS=true`, behind HTTPS only),
  immutable caching for hashed assets, `no-cache` for the app shell and `config.js`, and gzip.
- **Quality gates**: Playwright e2e tests in demo mode, Lighthouse CI budgets (performance, accessibility,
  best practices), CodeQL, a Docker build with a smoke test, and Dependabot for npm, GitHub Actions and Docker.
- Architecture decision records in `docs/adr/`.

### Changed

- Server state moved to TanStack Query: shared cache, invalidation by resource, a retry policy that never
  retries `4xx`, and optimistic deletes and settings changes with rollback.
- Runtime configuration through `/config.js`, written when the container starts, so one image runs anywhere.
- Upgraded to keycloak-js 26 (authorization code flow with PKCE).
- Employees are addressed by their stable `id` in URLs and API calls (HR API v2).
- A new visual design: design tokens, one stylesheet per component, Inter with tabular numbers.
- Manager pages and the sign-in providers are lazy-loaded; the app shell paints before the JavaScript loads.

### Fixed

- A person link with a malformed id now shows *This person doesn't exist* instead of a generic error: the API
  answers `400` for an id that isn't a UUID, and the demo-mode mock now does too.

### Security

- The CSP allows scripts and styles from the app's own origin only; the theme script moved out of
  `index.html` so no inline script is needed.

## [1.0.0] - 2026-09-21

The first version of the frontend, for version 1 of the HR API.

### Added

- Sign-in with Keycloak (authorization code flow with PKCE), token refresh, and a typed Axios client that maps
  backend errors (`400`, `403`, `404`, `409`) to messages.
- Role-aware UI: managers list, create, edit and delete employees; employees edit their own email and address.
- Feedback: a list with sentiment badges and a form to send feedback to a colleague.
- Inline validation matching the backend, loading and empty states, light and dark theme.
- React 19, React Router 7, Vite, strict TypeScript, ESLint and Vitest; GitHub Actions CI; a Dockerfile with
  nginx.
