import { Search, X } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context';
import { Avatar } from './Avatar';
import { FieldFrame } from './Field';
import { describedBy } from './fieldIds';
import { filterPeople, type PersonOption } from './filterPeople';
import './PersonCombobox.css';

interface PersonComboboxProps {
  label: string;
  people: PersonOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Show at most this many matches. */
  limit?: number;
}

/**
 * Searchable single-select following the WAI-ARIA combobox pattern with list autocomplete: typing filters,
 * ArrowUp/ArrowDown move the active option (announced via aria-activedescendant), Enter picks it, Escape
 * closes the list and, when it is already closed, clears the text.
 */
export function PersonCombobox({ label, people, value, onChange, error, hint, placeholder, disabled, limit = 50 }: PersonComboboxProps) {
  const { t, tp } = useI18n();
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = people.find((person) => person.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const text = editing || !selected ? query : selected.name;
  const matches = useMemo(() => filterPeople(people, editing ? query : '').slice(0, limit), [people, query, editing, limit]);
  const activeOption = open ? matches[active] : undefined;

  const openList = (index: number) => {
    setOpen(true);
    setActive(Math.max(0, Math.min(index, matches.length - 1)));
  };

  const choose = (person: PersonOption) => {
    onChange(person.id);
    setQuery('');
    setEditing(false);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList(selected ? matches.findIndex((p) => p.id === selected.id) : 0);
        else setActive((i) => (i + 1) % Math.max(matches.length, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList(matches.length - 1);
        else setActive((i) => (i - 1 + matches.length) % Math.max(matches.length, 1));
        break;
      case 'Home':
      case 'End':
        if (open && matches.length) {
          event.preventDefault();
          setActive(event.key === 'Home' ? 0 : matches.length - 1);
        }
        break;
      case 'Enter':
        if (open && activeOption) {
          event.preventDefault();
          choose(activeOption);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        } else if (text) {
          event.preventDefault();
          setQuery('');
          setEditing(true);
          onChange(null);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <div className={`combobox${open ? ' combobox--open' : ''}`}>
        <span className="combobox__leading" aria-hidden="true">
          {selected && !editing ? <Avatar name={selected.name} size="xs" /> : <Search size={16} />}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          className="input combobox__input"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          disabled={disabled}
          value={text}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOption ? `${id}-option-${activeOption.id}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(event) => {
            setQuery(event.target.value);
            setEditing(true);
            setOpen(true);
            setActive(0);
            if (value) onChange(null);
          }}
          onClick={() => (open ? setOpen(false) : openList(0))}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setOpen(false);
            setEditing(false);
            if (!value) setQuery('');
          }}
        />
        {text && !disabled && (
          <button
            type="button"
            className="combobox__clear"
            aria-label={t('combobox.clear')}
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery('');
              setEditing(true);
              onChange(null);
              inputRef.current?.focus();
              setOpen(true);
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <ul id={listboxId} role="listbox" aria-label={label} className="combobox__list" hidden={!open}>
          {matches.map((person, index) => (
            <li
              key={person.id}
              id={`${id}-option-${person.id}`}
              role="option"
              aria-selected={index === active}
              className={`combobox__option${index === active ? ' combobox__option--active' : ''}${person.id === value ? ' combobox__option--selected' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => choose(person)}
            >
              <Avatar name={person.name} size="sm" />
              <span className="combobox__option-text">
                <span className="combobox__option-name">{person.name}</span>
                <span className="combobox__option-meta">
                  {person.role} · {person.department}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {open && matches.length === 0 && <div className="combobox__empty">{t('combobox.noMatches')}</div>}
      </div>
      <span className="visually-hidden" aria-live="polite">
        {open ? tp('combobox.results', matches.length) : ''}
      </span>
    </FieldFrame>
  );
}
