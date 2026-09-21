# Architecture decision records

Short records of the decisions that shape this frontend, in the [MADR](https://adr.github.io/madr/) format:
the context, the options that were on the table, what was chosen and what it costs.

| #    | Decision                                                                 | Status   |
|------|--------------------------------------------------------------------------|----------|
| 0001 | [TanStack Query for server state](0001-tanstack-query-for-server-state.md) | Accepted |
| 0002 | [Runtime configuration through `/config.js`](0002-runtime-config-via-config-js.md) | Accepted |
| 0003 | [A demo mode backed by Mock Service Worker](0003-demo-mode-with-msw.md)  | Accepted |
| 0004 | [Plain CSS with design tokens instead of a UI kit](0004-css-tokens-over-ui-kit.md) | Accepted |
| 0005 | [A small typed i18n layer](0005-typed-i18n.md)                           | Accepted |
| 0006 | [API types generated from the backend's OpenAPI document](0006-openapi-generated-types.md) | Accepted |

A new record gets the next number. Records aren't rewritten when a decision changes: a new one supersedes them.
