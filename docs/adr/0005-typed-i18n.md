# 0005. A small typed i18n layer

- Status: accepted
- Date: 2026-09-21

## Context

The app ships in English, Spanish and German. German must address the user formally (*Sie*). Dates, numbers,
currencies and plurals must follow the chosen language, not the browser's. The dictionaries are small
(a few hundred keys) and there is no translation team or translation-management platform.

## Considered options

1. i18next / react-i18next.
2. FormatJS (react-intl) with ICU messages.
3. A small in-house layer: typed dictionaries, `{name}` interpolation, `_one`/`_other` plural keys chosen with
   `Intl.PluralRules`, and `Intl` formatters for everything else.

## Decision

Option 3 (`src/i18n/`). English is the source of truth: `MessageKey` is derived from `en.ts`, so other locales
must provide every key (a compile error otherwise) and `t('...')` only accepts existing keys. Unit tests check
that every language has the same keys and placeholders, and that German never uses *du*. The language is
detected from the browser, can be changed in the user menu, is remembered, and sets `<html lang>`. Dates and
numbers use `Intl` with the app's locale (`en-GB`, `es-ES`, `de-DE`); the date field formats and parses in that
locale too, instead of relying on `<input type="date">`, which follows the browser.

The libraries are more capable (ICU select, lazy namespaces, extraction tooling), but most of that is unused
at this size, and both weigh more than the whole layer. The typed keys are stricter than their defaults.

## Consequences

- Missing or misspelled keys fail the type-check; placeholder mismatches fail a test.
- No ICU syntax: gender or nested selects would need new code, or a move to FormatJS.
- All dictionaries are in the main bundle (a few kB each), which is fine for three languages.
