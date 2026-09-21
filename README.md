# HR Portal

[![CI](https://github.com/jacidProgrammer/HRWebApp-UI/actions/workflows/ci.yml/badge.svg)](https://github.com/jacidProgrammer/HRWebApp-UI/actions/workflows/ci.yml)

**Peer recognition for everyone, with insights for managers.** Colleagues thank each other for specific work,
tagged with a company value. Managers see how recognition flows across the company: monthly sentiment trends,
which values show up most, who gets recognised, and an early alert when positive feedback about someone drops.

This is the React + TypeScript frontend for [HRWebApp](https://github.com/jacidProgrammer/HRWebApp), a Spring Boot
API secured with Keycloak. There's also a **demo mode** that runs entirely in the browser, with no backend and
no account: `npm run dev:mock`.

![Manager dashboard: KPI cards, stacked sentiment trend, alert about a drop in positive feedback](docs/dashboard-light.png)

| People directory (manager) | My recognition (employee) |
|---|---|
| ![Sortable people table with department chips and salaries](docs/people-light.png) | ![Received recognition with value tags and sentiment](docs/recognition-light.png) |

| Person page, dark theme | Give recognition on a phone |
|---|---|
| ![Person page in dark mode with sentiment summary](docs/person-dark.png) | ![Recognition form at 390 px wide in dark mode](docs/give-recognition-mobile-dark.png) |

## Features

### Employees (`EMPLOYEE`)

- **My recognition** (home). Shows the feedback you've received with its value tag, sentiment, date and author
  (or *Anonymous*), plus a **Sent** tab. There's a short summary on top: how much you've received, how many
  positive notes, and the value you're recognised for most.
- **Give recognition**:
  - pick the colleague in an accessible combobox (full keyboard support, live result count);
  - optionally tag a value: Teamwork, Ownership, Craft, Customer focus or Growth;
  - write the message: a character counter appears only near the 500-character limit;
  - choose whether to send it anonymously.

  A notice says, before you write, whether the message will be analysed by the AI model; it follows the
  organisation's setting. A live preview shows how the recipient will see it.
- **Directory**: a read-only list of colleagues. Salary and address are hidden, and the API doesn't return them anyway.
- **My profile**: update your email and address. Your salary, address and start date are shown only to you
  (and to managers).

### Managers (`MANAGER`)

- **Dashboard** (`GET /stats/overview`):
  - KPI cards: headcount, feedback this month with the change from last month, share of positive feedback, departments.
  - A stacked sentiment trend over 3, 6 or 12 months. It's an accessible SVG with a legend, a hover tooltip and a
    *Show table* fallback.
  - Value distribution and the five most recognised people.
  - An **alerts** panel that links to the person.
- **People**: a sortable table with a sticky header.
  - Search and department filters live in the URL, so a filtered view can be bookmarked or shared.
  - Clicking a row opens the person. The row menu has *Edit* and *Delete* (with confirmation).
  - You can also create people. Validation matches the backend: required fields, email format, salary > 0.
- **Person page**: details, feedback about them and a sentiment summary.
- **Feedback explorer** (`GET /feedback`): filter by department, person, sentiment and date range. Every
  filter is in the URL.
- **Settings**: turn AI sentiment analysis on or off (`PUT /settings`). The page also shows whether a model is
  configured and explains what the product guarantees about privacy.

### Everyone

- Light, dark and system themes (remembered), in English, Spanish and German. German uses *Sie*. The language is
  detected from the browser and can be switched in the user menu.
- A collapsible sidebar that becomes a drawer on phones. Works down to 360 px wide.
- Skeletons while loading, and empty and error states with a retry. Toasts confirm actions. Deletes and the AI
  toggle update immediately and roll back if the server refuses.
- Pages for another role show *Access denied*, and the API rejects those requests too.

## Stack

- React 19, TypeScript (strict), Vite, React Router 7
- TanStack Query 5 for server state, and Axios for HTTP (bearer token, `401` handling, error mapping)
- `keycloak-js` 26: authorization code flow with PKCE (S256)
- Plain CSS: a design-token file (`src/styles/tokens.css`) with light and dark themes, and one stylesheet per
  component. No Tailwind, no UI kit.
- Inter (variable, self-hosted via `@fontsource-variable`) with tabular numbers, and `lucide-react` icons
- Mock Service Worker for demo mode
- Vitest + Testing Library, Playwright, ESLint (type-checked `typescript-eslint` rules)

## Architecture

```
src/
├── api/          Axios client, ApiError mapping, endpoint functions, query keys, TanStack Query hooks
├── app/          Providers and routes (manager pages are lazy-loaded)
├── auth/         Keycloak and demo-mode providers, useAuth, RequireRole
├── components/
│   ├── shell/    App shell: sidebar/drawer, top bar, theme and user menus, page titles
│   ├── ui/       Avatar, chips, sentiment indicator, dialog, menu, toast, tabs, fields, switch, combobox, …
│   └── charts/   Sentiment trend chart and its (unit-tested) data transform
├── features/     One folder per area: dashboard, people, recognition, feedback, profile, settings, system
├── i18n/         Typed dictionaries (en is the source of truth), plural rules, provider
├── lib/          Formatting (Intl), validation that mirrors the backend, colour hashing, storage helpers
├── mocks/        Demo mode: seeded data, MSW handlers implementing the API contract, stats computation
├── styles/       tokens.css and base.css
└── theme/        Theme provider (light / dark / system)
```

- **Server state** lives in TanStack Query. Each resource has its own query keys (`employees`, `feedback`,
  `stats`, `settings`). Mutations invalidate by prefix, so every cached list of a resource refreshes. The client
  never retries a `4xx`, and retries network errors and `5xx` at most twice.
- **Errors**: every failure becomes an `ApiError` with a kind (`BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`,
  `CONFLICT`, `SERVER`, `NETWORK`, …). The UI localises it and prefers the backend's own message when it sends one.
- **Identity**: URLs use the employee `id`. "Is this me?" compares the token's `preferred_username` with the
  employee `username`, case-insensitively. Employees load their own record from `GET /employees/me`.
- **Runtime config**: `index.html` loads `/config.js`, which sets `window.__APP_CONFIG__`. In Docker it is written
  at container start (see below). In development it is empty and the `VITE_*` variables apply. That way one image
  runs in any environment.

## Running it with the backend

You need Node.js 22.12+, Docker and a clone of the backend.

1. **Start Keycloak 26 and the databases** from the backend repository:

   ```bash
   git clone https://github.com/jacidProgrammer/HRWebApp.git
   cd HRWebApp
   docker compose up -d
   ```

   Keycloak runs on `http://localhost:8082` and imports the `hr-realm` realm. That realm has the public
   client `hr-api-login`, which allows redirects to `http://localhost:5173`. If you ran an older version of the
   stack, run `docker compose down -v` once, so the new realm is imported.

2. **Start the API** on `http://localhost:8080` (JDK 21), still in the backend repository:

   ```bash
   ./mvnw spring-boot:run                                        # in-memory H2 with demo data
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres    # or PostgreSQL
   ```

   Set `HUGGINGFACE_TOKEN` to enable sentiment analysis. Without it, feedback is saved and shows as *Not analysed*.

3. **Start the UI** in this repository:

   ```bash
   cp .env.example .env   # optional: the defaults match the setup above
   npm install
   npm run dev
   ```

   Open <http://localhost:5173> and sign in. The dev server is pinned to port 5173, because that origin is
   registered in Keycloak and in the backend's CORS settings.

**Demo users** (from the backend's realm export, *for local use only*). The password is `1234` for all of them.

| User      | Role       | Try                                                              |
|-----------|------------|------------------------------------------------------------------|
| `manager` | `MANAGER`  | Dashboard, people, feedback explorer, settings                   |
| `jose`    | `EMPLOYEE` | Give and receive recognition, edit your profile                  |
| `louisa`, `maria`, `lukas` | `EMPLOYEE` | The same, from other points of view                 |

### Configuration

| Build-time (dev)          | Runtime (Docker)     | Default                 |
|---------------------------|----------------------|-------------------------|
| `VITE_API_BASE_URL`       | `API_BASE_URL`       | `http://localhost:8080` |
| `VITE_KEYCLOAK_URL`       | `KEYCLOAK_URL`       | `http://localhost:8082` |
| `VITE_KEYCLOAK_REALM`     | `KEYCLOAK_REALM`     | `hr-realm`              |
| `VITE_KEYCLOAK_CLIENT_ID` | `KEYCLOAK_CLIENT_ID` | `hr-api-login`          |
| `VITE_AUTH_MODE`          | `AUTH_MODE`          | `keycloak` (or `mock`)  |

Runtime values win over build-time ones.

## Demo mode

```bash
npm install
npm run dev:mock        # http://localhost:5173
```

Demo mode swaps Keycloak for a role picker and serves the API from the browser with
[Mock Service Worker](https://mswjs.io). The fake API implements the same contract as the backend, including
role checks, validation errors and the `409` for a duplicate username.

- The seed data is 12 employees in four departments, about 50 feedback items spread over six months, and one alert.
- Changes last until you close the tab (they're kept in `sessionStorage`).
- A **Demo mode** banner is always visible.
- Sentiment for new messages comes from a simple keyword heuristic, not the real model.

Demo mode is never on by default: it needs `--mode mock`, `VITE_AUTH_MODE=mock` or the runtime `AUTH_MODE=mock`.
If a browser refuses to register the service worker (some private modes and embedded webviews), the same handlers
answer inside the page instead.

## Scripts

| Command                    | What it does                                                   |
|----------------------------|----------------------------------------------------------------|
| `npm run dev`              | Dev server on <http://localhost:5173> against the real backend |
| `npm run dev:mock`         | Dev server in demo mode                                        |
| `npm run build`            | Type-check and production build (`dist/`)                      |
| `npm run build:mock`       | Demo-mode build (`dist-mock/`), used by the e2e tests          |
| `npm run preview`          | Serve `dist/`                                                  |
| `npm run preview:mock`     | Serve `dist-mock/` on port 4180                                |
| `npm run lint`             | ESLint                                                         |
| `npm run typecheck`        | TypeScript only                                                |
| `npm test`                 | Unit and component tests (Vitest)                              |
| `npm run test:e2e`         | Playwright end-to-end tests in demo mode                       |
| `npm run docs:screenshots` | Regenerate the README screenshots (needs `preview:mock` running) |

## Testing

- **Unit and component tests** (Vitest, jsdom) sit next to the code. They cover:
  - the API client and error mapping, the retry policy, and the query and mutation hooks (optimistic updates and
    rollbacks), run against the demo-mode handlers;
  - combobox keyboard behaviour, the chart data transform, i18n (key and placeholder parity across languages,
    fallback, formal German) and `RequireRole`;
  - validation and formatting;
  - the give-recognition, people, settings and profile pages.
- **End-to-end tests** (Playwright, Chromium) run against the demo-mode build.
  - Manager: dashboard KPIs, chart and alert; sorting and filtering people through the URL; creating, editing and
    deleting a person; the AI toggle.
  - Employee: giving anonymous recognition and finding it under *Sent*; received recognition; editing the profile;
    being blocked from manager pages.

  Install the browser once with `npx playwright install chromium`.

CI (`.github/workflows/ci.yml`) runs lint, unit tests and the build, then the e2e suite, on every push and pull
request to `main`.

## Docker

```bash
docker build -t hr-portal .
docker run --rm -p 5173:80 hr-portal
```

The image is built once and configured at startup.

- An nginx entrypoint script (`docker/40-app-config.sh`) writes `/config.js` from the runtime variables in the
  table above.
- nginx serves the SPA with a fallback to `index.html`, and `/config.js` is never cached.
- Publish the container on port 5173 to reuse the realm's redirect URI. For any other origin, add it to the
  Keycloak client and to the backend's `CORS_ALLOWED_ORIGINS`.

For example:

```bash
docker run --rm -p 8088:80 \
  -e API_BASE_URL=https://api.example.com \
  -e KEYCLOAK_URL=https://auth.example.com \
  hr-portal

docker run --rm -p 8089:80 -e AUTH_MODE=mock hr-portal   # a self-contained demo
```

## Privacy

- Feedback can be anonymous. The API never returns the author of anonymous feedback, not even to managers.
- Salary and address are only visible to managers and to the employee themselves.
- Authors are told before they write whether their message will be analysed by the AI model, and managers can turn
  the analysis off for the whole organisation.
- Alerts are built from aggregated sentiment only, never from message content.

The backend README covers the details, including what deleting a person removes and the GDPR considerations:
[HRWebApp › Privacy and GDPR](https://github.com/jacidProgrammer/HRWebApp#privacy-and-gdpr).

## License

[MIT](LICENSE)
