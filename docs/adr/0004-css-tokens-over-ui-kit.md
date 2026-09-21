# 0004. Plain CSS with design tokens instead of a UI kit

- Status: accepted
- Date: 2026-09-21

## Context

The redesign needed a consistent look in light and dark themes, dense data screens (tables, charts, filters)
and accessible custom widgets (combobox, menus, dialogs, a date picker). The bundle should stay small, since
the employee screens (giving recognition) must work well on phones.

## Considered options

1. A component library (MUI, Mantine, Chakra).
2. Tailwind CSS.
3. Plain CSS: one token file and one stylesheet per component.

## Decision

Option 3. `src/styles/tokens.css` defines colours, type scale, spacing, radii and shadows as custom
properties, with a dark theme that only redefines them. Every component imports its own stylesheet
(`Avatar.tsx` + `Avatar.css`) using BEM-style class names and only tokens for values. Widgets follow the
WAI-ARIA Authoring Practices and are tested with Testing Library by role.

A UI kit would bring its own look to override, a runtime styling engine or a large bundle, and less control
over the ARIA details. Tailwind is a good fit for many teams, but the value here is showing the design system
itself: the tokens and the components that use them.

## Consequences

- No styling dependency; CSS is split per lazy-loaded page by Vite; theming is one attribute on `<html>`.
- A strict Content-Security-Policy (`style-src 'self'`) works, because nothing injects `<style>` at run time.
- Accessible widgets are ours to build and maintain (combobox, menu, dialog, date picker, tabs, toasts).
- Conventions (tokens only, one file per component) are enforced by review, not by a tool.
