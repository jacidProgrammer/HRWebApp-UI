import { describe, expectTypeOf, it } from 'vitest';
import type {
  COMPANY_VALUES,
  CompanyValue,
  Employee,
  ErrorResponseBody,
  Feedback,
  FeedbackInput,
  FeedbackQuery,
  SENTIMENT_LABELS,
  Sentiment,
  SentimentFilter,
  SentimentLabel,
  Settings,
  StatsOverview,
} from './types';

// The app's types are derived from the generated OpenAPI schema. These checks pin down what they must be,
// so a change to the generator or to the backend's document can't silently widen or narrow them.
describe('API types derived from the OpenAPI document', () => {
  it('makes every employee field present and only salary and address nullable', () => {
    expectTypeOf<Employee>().toEqualTypeOf<{
      id: string;
      username: string;
      name: string;
      department: string;
      role: string;
      email: string;
      salary: number | null;
      address: string | null;
      createdAt: string;
    }>();
  });

  it('narrows feedback enums and nullable fields', () => {
    expectTypeOf<Feedback['value']>().toEqualTypeOf<CompanyValue | null>();
    expectTypeOf<Feedback['sentiment']>().toEqualTypeOf<Sentiment | null>();
    expectTypeOf<Feedback['authorId']>().toEqualTypeOf<string | null>();
    expectTypeOf<Feedback['recipientId']>().toEqualTypeOf<string>();
    expectTypeOf<Sentiment['label']>().toEqualTypeOf<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>();
  });

  it('lists exactly the enums of the document', () => {
    expectTypeOf<(typeof COMPANY_VALUES)[number]>().toEqualTypeOf<CompanyValue>();
    expectTypeOf<(typeof SENTIMENT_LABELS)[number]>().toEqualTypeOf<SentimentLabel>();
    expectTypeOf<SentimentFilter>().toEqualTypeOf<SentimentLabel | 'NONE'>();
  });

  it('types request bodies as the app sends them', () => {
    expectTypeOf<FeedbackInput['anonymous']>().toEqualTypeOf<boolean>();
    expectTypeOf<FeedbackInput['recipientId']>().toEqualTypeOf<string>();
    expectTypeOf<ErrorResponseBody>().toEqualTypeOf<{ code: string; message: string }>();
  });

  it('keeps optional inputs optional', () => {
    expectTypeOf<FeedbackInput['value']>().toEqualTypeOf<CompanyValue | null | undefined>();
    expectTypeOf<FeedbackQuery['sentiment']>().toEqualTypeOf<SentimentFilter | undefined>();
    expectTypeOf<FeedbackQuery['from']>().toEqualTypeOf<string | undefined>();
  });

  it('types the nested stats objects', () => {
    expectTypeOf<StatsOverview['valueCounts'][number]>().toEqualTypeOf<{ value: CompanyValue; count: number }>();
    expectTypeOf<StatsOverview['feedback']>().toEqualTypeOf<{ thisMonth: number; lastMonth: number; total: number }>();
    expectTypeOf<Settings>().toEqualTypeOf<{ sentimentAnalysisEnabled: boolean; sentimentAnalysisAvailable: boolean }>();
  });
});
