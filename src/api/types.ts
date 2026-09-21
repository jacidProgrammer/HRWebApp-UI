/**
 * The app's view of HR API contract v2, derived from the backend's OpenAPI document
 * (src/api/generated/schema.d.ts, regenerated with `npm run api:types`). Dates are ISO-8601 UTC strings,
 * ids are UUIDs.
 *
 * The document declares required fields, nullability and enums, so most types here are the generated
 * schemas under the app's names. Where the app is stricter than the contract (request bodies it always
 * sends in full), {@link Narrow} tightens a property, and can only tighten it: an override must be
 * assignable to what the document allows. Renaming, removing or retyping a field in the backend breaks
 * the type-check.
 */
import type { components, operations } from './generated/schema';

type Schemas = components['schemas'];

/** Every property present and not undefined (for request bodies whose fields the document leaves optional). */
type Wire<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };

/**
 * Stricter versions of some properties of `T`. Each override must name a property of the schema and be
 * assignable to it, so it can narrow the document but never contradict it.
 */
type Narrow<T, Overrides extends { [K in keyof Overrides]: K extends keyof T ? Exclude<T[K], undefined> : never }> = Overrides;

/** Flattens intersections so editor tooltips show plain objects. */
type Plain<T> = { [K in keyof T]: T[K] } & {};

export type CompanyValue = NonNullable<Schemas['FeedbackDTO']['value']>;
/** The company values in display order; types.test.ts checks they are exactly the document's enum. */
export const COMPANY_VALUES = ['TEAMWORK', 'OWNERSHIP', 'CRAFT', 'CUSTOMER_FOCUS', 'GROWTH'] as const satisfies readonly CompanyValue[];

export type Sentiment = NonNullable<Schemas['SentimentDTO']>;
export type SentimentLabel = Sentiment['label'];
/** Sentiment labels in display order; types.test.ts checks they are exactly the document's enum. */
export const SENTIMENT_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] as const satisfies readonly SentimentLabel[];

/**
 * `username` is the Keycloak username: unique, immutable, matched case-insensitively against
 * `preferred_username`. `salary` and `address` are null unless the caller is a MANAGER or the employee.
 */
export type Employee = Schemas['EmployeeDTO'];

/** Body of POST /employees (MANAGER): every field is required. */
export type EmployeeCreateInput = Wire<Schemas['EmployeeRequestDTO']>;

/** Body of a manager's PUT /employees/{id}: every field except the immutable username. */
export type EmployeeUpdateInput = Omit<EmployeeCreateInput, 'username'>;

/** Body of an employee's PUT on their own record: only the contact details may change. */
export type ContactDetailsInput = Pick<EmployeeCreateInput, 'email' | 'address'>;

/** `authorId`/`authorName` are null for anonymous feedback (except for its author) or a deleted author. */
export type Feedback = Schemas['FeedbackDTO'];

/** Body of POST /feedback. The app always says whether it is anonymous. */
export type FeedbackInput = Plain<
  Omit<Schemas['FeedbackRequestDTO'], 'anonymous'> & Narrow<Schemas['FeedbackRequestDTO'], { anonymous: boolean }>
>;

/** Query of GET /feedback. The app sends `from` and `to` as inclusive ISO dates (YYYY-MM-DD). */
export type FeedbackQuery = NonNullable<operations['searchFeedback']['parameters']['query']>;

/** Sentiment filter of GET /feedback; NONE means "not analysed". */
export type SentimentFilter = NonNullable<FeedbackQuery['sentiment']>;

export type TrendPoint = Schemas['TrendDTO'];

export type SentimentAlert = Schemas['AlertDTO'];

export type StatsOverview = Schemas['StatsOverviewDTO'];

export type Settings = Schemas['SettingsDTO'];

/** Months of history for GET /stats/overview (1..12; 6 when omitted). */
export type StatsMonths = NonNullable<NonNullable<operations['getOverview']['parameters']['query']>['months']>;

/** Error body of the API (`GlobalExceptionHandler`); 401 and role-based 403 responses have no body. */
export type ErrorResponseBody = Schemas['ErrorResponse'];
