import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { filterPeople, type PersonOption } from './filterPeople';
import { PersonCombobox } from './PersonCombobox';

const people: PersonOption[] = [
  { id: '1', name: 'José Antonio', username: 'jose', department: 'IT', role: 'Java Senior Backend' },
  { id: '2', name: 'Louisa Becker', username: 'louisa', department: 'IT', role: 'Senior Agile Coach' },
  { id: '3', name: 'Maria Rossi', username: 'maria', department: 'Sales', role: 'Account Executive' },
];

function Harness({ onChange }: { onChange: (id: string | null) => void }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <PersonCombobox
      label="Colleague"
      people={people}
      value={value}
      onChange={(id) => {
        setValue(id);
        onChange(id);
      }}
    />
  );
}

describe('filterPeople', () => {
  it('matches every word against name, username, department and role, ignoring accents and case', () => {
    expect(filterPeople(people, 'jose').map((p) => p.id)).toEqual(['1']);
    expect(filterPeople(people, 'JOSÉ').map((p) => p.id)).toEqual(['1']);
    expect(filterPeople(people, 'it coach').map((p) => p.id)).toEqual(['2']);
    expect(filterPeople(people, '')).toHaveLength(3);
  });
});

describe('PersonCombobox', () => {
  it('opens with ArrowDown, moves the active option and picks it with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Colleague' });

    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(input.getAttribute('aria-activedescendant')).toContain('option-1');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: /Maria Rossi/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /José Antonio/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{Enter}');

    expect(onChange).toHaveBeenLastCalledWith('3');
    expect(input).toHaveValue('Maria Rossi');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters as you type and Escape closes, then clears', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Colleague' });

    await user.type(input, 'lou');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2');

    await user.type(input, 'x');
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'zzz');

    expect(screen.getByText('No colleagues match your search.')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
