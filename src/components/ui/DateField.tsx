import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context';
import {
  addDays,
  addMonths,
  clampDate,
  firstDayOfWeek,
  formatHint,
  formatIsoDate,
  isoParts,
  monthGrid,
  parseDate,
  todayIso,
  weekday,
} from '../../lib/dates';
import { FieldFrame } from './Field';
import './DateField.css';

interface DateFieldProps {
  label: string;
  /** ISO date (`YYYY-MM-DD`), or undefined when empty. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Earliest allowed ISO date, inclusive. */
  min?: string;
  /** Latest allowed ISO date, inclusive. */
  max?: string;
}

/**
 * A date input that reads and writes dates in the app's language (`21/09/2026`, `21.09.2026`), whatever the
 * browser's own locale. Dates can be typed (validated on blur or Enter) or picked from a calendar that
 * follows the WAI-ARIA date picker dialog pattern: arrow keys move by day and week, Page Up/Down by month
 * (with Shift, by year), Home/End to the start and end of the week, Enter picks, Escape closes.
 */
export function DateField({ label, value, onChange, min, max }: DateFieldProps) {
  const { t, intlLocale } = useI18n();
  const id = useId();
  const hint = formatHint(intlLocale, t('date.formatLetters'));
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const text = draft ?? (value ? formatIsoDate(value, intlLocale) : '');
  const longDate = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [intlLocale],
  );
  const describe = (iso: string) => {
    const [y, m, d] = isoParts(iso);
    return longDate.format(new Date(Date.UTC(y, m - 1, d)));
  };

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(null);
      setError(undefined);
      if (value !== undefined) onChange(undefined);
      return;
    }
    const parsed = parseDate(trimmed, intlLocale);
    if (!parsed) return setError(t('date.invalid', { pattern: hint }));
    if (min && parsed < min) return setError(t('date.tooEarly', { date: describe(min) }));
    if (max && parsed > max) return setError(t('date.tooLate', { date: describe(max) }));
    setDraft(null);
    setError(undefined);
    if (parsed !== value) onChange(parsed);
  };

  const pick = (iso: string) => {
    setDraft(null);
    setError(undefined);
    setOpen(false);
    toggleRef.current?.focus();
    if (iso !== value) onChange(iso);
  };

  // Close the calendar on a click outside the field.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <FieldFrame id={id} label={label} error={error} hint={undefined}>
      <div
        className="date-field"
        ref={rootRef}
        onBlur={(event) => {
          // Tabbing out of the calendar closes it.
          if (open && !rootRef.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <input
          id={id}
          type="text"
          className="input date-field__input"
          lang={intlLocale}
          autoComplete="off"
          spellCheck={false}
          placeholder={hint}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-format`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape' && draft !== null) {
              event.preventDefault();
              setDraft(null);
              setError(undefined);
            }
          }}
        />
        <span id={`${id}-format`} className="visually-hidden">
          {t('date.formatHint', { pattern: hint })}
        </span>
        <button
          ref={toggleRef}
          type="button"
          className="date-field__toggle"
          aria-label={value ? t('date.changeFor', { label, date: describe(value) }) : t('date.chooseFor', { label })}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            // Open towards the left when a 296px calendar would overflow the viewport on the right.
            const left = rootRef.current?.getBoundingClientRect().left ?? 0;
            setAlignEnd(left + 296 > document.documentElement.clientWidth - 8);
            setOpen((current) => !current);
          }}
        >
          <CalendarDays size={16} aria-hidden="true" />
        </button>
        {open && (
          <CalendarDialog
            label={label}
            alignEnd={alignEnd}
            selected={value}
            min={min}
            max={max}
            locale={intlLocale}
            onPick={pick}
            onClose={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
          />
        )}
      </div>
    </FieldFrame>
  );
}

interface CalendarDialogProps {
  label: string;
  alignEnd: boolean;
  selected: string | undefined;
  min: string | undefined;
  max: string | undefined;
  locale: string;
  onPick: (iso: string) => void;
  onClose: () => void;
}

function CalendarDialog({ label, alignEnd, selected, min, max, locale, onPick, onClose }: CalendarDialogProps) {
  const { t } = useI18n();
  const headingId = useId();
  const today = todayIso();
  const [focused, setFocused] = useState(() => clampDate(selected ?? today, min, max));
  const gridRef = useRef<HTMLTableElement>(null);
  const [year, month] = isoParts(focused);
  const weekStart = firstDayOfWeek(locale);
  const weeks = useMemo(() => monthGrid(year, month, weekStart), [year, month, weekStart]);
  // Focus follows the focused day on open and on keyboard moves, but stays on the month buttons.
  const focusDay = useRef(true);

  const formatters = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }),
      full: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }),
    [locale],
  );
  const asDate = (iso: string) => {
    const [y, m, d] = isoParts(iso);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max);

  // Roving focus: the focused day is the only tabbable one and follows keyboard moves.
  useEffect(() => {
    if (focusDay.current) gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused]);

  const move = (next: string, withFocus: boolean) => {
    focusDay.current = withFocus;
    setFocused(clampDate(next, min, max));
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const keys: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((weekday(focused) - weekStart + 7) % 7)),
      End: () => addDays(focused, 6 - ((weekday(focused) - weekStart + 7) % 7)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const target = keys[event.key];
    if (target) {
      event.preventDefault();
      move(target(), true);
    }
  };

  const weekdays = weeks[0] ?? [];

  return (
    <div
      className={`date-dialog${alignEnd ? ' date-dialog--end' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={t('date.calendarFor', { label })}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="date-dialog__header">
        <button type="button" className="date-dialog__nav" aria-label={t('date.previousMonth')} onClick={() => move(addMonths(focused, -1), false)}>
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <h2 id={headingId} className="date-dialog__title" aria-live="polite">
          {formatters.title.format(asDate(focused))}
        </h2>
        <button type="button" className="date-dialog__nav" aria-label={t('date.nextMonth')} onClick={() => move(addMonths(focused, 1), false)}>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <table ref={gridRef} className="date-dialog__grid" role="grid" aria-labelledby={headingId} onKeyDown={onGridKeyDown}>
        <thead>
          <tr>
            {weekdays.map((iso) => (
              <th key={iso} scope="col" abbr={formatters.weekdayLong.format(asDate(iso))}>
                {formatters.weekdayShort.format(asDate(iso))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((iso) => {
                const outside = isoParts(iso)[1] !== month;
                const isSelected = iso === selected;
                const enabled = allowed(iso);
                const classes = ['date-dialog__day'];
                if (outside) classes.push('date-dialog__day--outside');
                if (isSelected) classes.push('date-dialog__day--selected');
                if (iso === today) classes.push('date-dialog__day--today');
                return (
                  <td key={iso} aria-selected={isSelected}>
                    <button
                      type="button"
                      className={classes.join(' ')}
                      data-date={iso}
                      tabIndex={iso === focused ? 0 : -1}
                      aria-label={formatters.full.format(asDate(iso))}
                      aria-current={iso === today ? 'date' : undefined}
                      aria-disabled={enabled ? undefined : true}
                      onClick={() => {
                        if (enabled) onPick(iso);
                      }}
                    >
                      {isoParts(iso)[2]}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="date-dialog__footer">
        <button type="button" className="btn btn--ghost btn--sm" disabled={!allowed(today)} onClick={() => onPick(today)}>
          {t('date.today')}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
