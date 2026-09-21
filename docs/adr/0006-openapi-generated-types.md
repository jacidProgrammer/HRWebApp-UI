# 0006. API types generated from the backend's OpenAPI document

- Status: accepted
- Date: 2026-09-21

## Context

The API types in `src/api/types.ts` were written by hand to mirror the backend's DTOs. Nothing checked them:
a field renamed in the backend would compile here and fail at run time, and the demo-mode mock (ADR 0003)
would keep the old shape. The backend (Spring Boot + springdoc) can describe itself as OpenAPI 3.

## Considered options

1. Keep hand-written types and review changes carefully.
2. Generate a full client (openapi-generator, orval) and replace `src/api/endpoints.ts`.
3. Generate types only (openapi-typescript) and derive the app's types from them.

## Decision

Option 3.

- `npm run api:types` downloads the backend's `docs/openapi.json` from its main branch (or reads a local path
  or URL) and writes `src/api/generated/openapi.json` (a pinned copy, without `servers`) and
  `src/api/generated/schema.d.ts`. Both are committed, so builds are offline and reproducible.
- `src/api/types.ts` keeps the app's names (`Employee`, `Feedback`, ...) and takes them from
  `components['schemas'][...]` and `operations[...]`. The backend annotates its DTOs (required fields,
  nullability, enums), so most are the schemas as they are. Where the app is stricter than the contract (it
  always sends `anonymous`; a create sends every field), a small helper narrows the type, constrained to stay
  assignable to what the document allows. Type-level tests (`types.test.ts`) pin the result, including that
  the value lists used by the UI (`COMPANY_VALUES`, `SENTIMENT_LABELS`) are exactly the document's enums.
- CI checks two things: the committed types match the pinned document (build job), and they match the
  backend's current document (`api-contract` job). While the backend hasn't published the file yet the URL
  answers 404, and the job warns and passes.

A generated client would replace a small, readable Axios layer with generated code and its conventions, for
little gain: there are nine endpoints.

## Consequences

- A breaking change in the backend's DTOs turns into a failing `api-contract` job, and after regeneration,
  into compile errors at every affected use.
- Adopting it surfaced real drift: the first document, exported from the running API before the backend
  annotated it, had no required fields, nullability or enums, documented `POST /employees` as `200` instead of
  `201`, and left out the error body. The published document fixes all of these, and the demo-mode mock now
  answers `400` for a malformed id, as the API does.
- `openapi-typescript` 7 declares a peer dependency on TypeScript 5; an npm `overrides` entry lets it use the
  project's TypeScript 6, which it works with.
