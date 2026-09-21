import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SentimentBadge } from './SentimentBadge';

describe('SentimentBadge', () => {
  it('shows the label and the score as a percentage', () => {
    render(<SentimentBadge label="positive" score={0.9731} />);

    const badge = screen.getByText('Positive');
    expect(badge).toHaveClass('badge--positive');
    expect(badge).toHaveTextContent('Positive, confidence 97%');
  });

  it('shows "Not analysed" when the backend stored no sentiment', () => {
    render(<SentimentBadge label={null} score={null} />);

    expect(screen.getByText('Not analysed')).toHaveClass('badge--muted');
  });
});
