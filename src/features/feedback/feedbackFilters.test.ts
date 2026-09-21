import { describe, expect, it } from 'vitest';
import { activeFilterCount, readFeedbackFilters, writeFeedbackFilters } from './feedbackFilters';

describe('feedback explorer filters', () => {
  it('reads valid filters from the URL and drops invalid ones', () => {
    const params = new URLSearchParams('dept=Sales&person=abc&sentiment=NEGATIVE&from=2026-09-01&to=yesterday');
    expect(readFeedbackFilters(params)).toEqual({ department: 'Sales', recipientId: 'abc', sentiment: 'NEGATIVE', from: '2026-09-01' });
    expect(readFeedbackFilters(new URLSearchParams('sentiment=HAPPY'))).toEqual({});
  });

  it('round-trips and counts active filters', () => {
    const query = { department: 'IT', sentiment: 'NONE' as const, to: '2026-09-30' };
    expect(readFeedbackFilters(writeFeedbackFilters(query))).toEqual(query);
    expect(activeFilterCount(query)).toBe(3);
  });
});
