import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Locale } from '../../i18n/core';
import { renderWithProviders } from '../../test/render';
import { DateField } from './DateField';

function Harness({ initial, onChange, min }: { initial?: string; onChange: (value: string | undefined) => void; min?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <DateField
      label="From"
      value={value}
      min={min}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const setup = (props: { initial?: string; min?: string } = {}, locale: Locale = 'en') => {
  const onChange = vi.fn();
  renderWithProviders(<Harness {...props} onChange={onChange} />, { locale });
  return { onChange, user: userEvent.setup(), input: screen.getByRole('textbox', { name: 'From' }) };
};

describe('DateField', () => {
  it('shows the value in the app language, whatever the browser locale', () => {
    setup({ initial: '2026-09-01' }, 'de');
    const input = screen.getByRole('textbox', { name: 'From' });
    expect(input).toHaveValue('01.09.2026');
    expect(input).toHaveAttribute('placeholder', 'TT.MM.JJJJ');
    expect(input).toHaveAccessibleDescription('Format: TT.MM.JJJJ');
  });

  it('parses a typed date on Enter and reformats it', async () => {
    const { onChange, user, input } = setup();
    await user.type(input, '5/9/26{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-09-05');
    expect(input).toHaveValue('05/09/2026');
  });

  it('explains an invalid date and keeps what was typed', async () => {
    const { onChange, user, input } = setup();
    await user.type(input, '31/02/2026');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a date as DD/MM/YYYY.');
    expect(input).toHaveValue('31/02/2026');
  });

  it('enforces the minimum date', async () => {
    const { onChange, user, input } = setup({ min: '2026-09-10' });
    await user.type(input, '01/09/2026{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAccessibleDescription('Choose 10 September 2026 or later.');
  });

  it('clears the filter when the text is erased', async () => {
    const { onChange, user, input } = setup({ initial: '2026-09-01' });
    await user.clear(input);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('picks a date from the calendar with the keyboard', async () => {
    const { onChange, user } = setup({ initial: '2026-09-15' });
    await user.click(screen.getByRole('button', { name: 'From: change the date, 15 September 2026' }));

    const dialog = screen.getByRole('dialog', { name: 'From: calendar' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
    // Weeks start on Monday in en-GB.
    expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday');
    expect(screen.getByRole('button', { name: 'Tuesday, 15 September 2026' })).toHaveFocus();

    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Wednesday, 23 September 2026' })).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Friday, 23 October 2026' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith('2026-10-23');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'From' })).toHaveValue('23/10/2026');
    expect(screen.getByRole('button', { name: /From: change the date/ })).toHaveFocus();
  });

  it('closes the calendar with Escape and returns focus to its button', async () => {
    const { onChange, user } = setup();
    const toggle = screen.getByRole('button', { name: 'From: choose a date' });
    await user.click(toggle);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not pick days before the minimum', async () => {
    const { onChange, user } = setup({ initial: '2026-09-15', min: '2026-09-10' });
    await user.click(screen.getByRole('button', { name: /From: change the date/ }));
    const early = screen.getByRole('button', { name: 'Wednesday, 9 September 2026' });
    expect(early).toHaveAttribute('aria-disabled', 'true');
    await user.click(early);
    expect(onChange).not.toHaveBeenCalled();
  });
});
