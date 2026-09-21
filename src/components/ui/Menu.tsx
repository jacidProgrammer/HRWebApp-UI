import { Check, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Menu.css';

export type MenuEntry =
  | { type?: 'item'; id: string; label: string; icon?: LucideIcon; onSelect: () => void; danger?: boolean; checked?: boolean }
  | { type: 'separator'; id: string }
  | { type: 'label'; id: string; label: string };

interface MenuButtonProps {
  /** Accessible name of the trigger (also used when the trigger shows only an icon). */
  label: string;
  children: ReactNode;
  entries: MenuEntry[];
  align?: 'start' | 'end';
  triggerClassName?: string;
  /** Items with `checked` render as radio items (e.g. theme, language). */
  radio?: boolean;
  header?: ReactNode;
}

type Position = { top: number; left?: number; right?: number };

/**
 * Menu button (WAI-ARIA APG pattern): Enter, Space or ArrowDown open it on the first item, ArrowUp on the
 * last; arrows, Home and End move; Escape closes and returns focus to the trigger; Tab closes.
 */
export function MenuButton({ label, children, entries, align = 'end', triggerClassName = 'btn btn--ghost btn--icon', radio = false, header }: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<'first' | 'last'>('first');
  const menuId = useId();

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  /** Places the menu under the trigger, or above it when it would overflow the bottom edge. */
  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const height = menuRef.current?.getBoundingClientRect().height ?? 0;
    const below = trigger.bottom + 6;
    const top = height && below + height > window.innerHeight - 8 && trigger.top - 6 - height > 8 ? trigger.top - 6 - height : below;
    setPosition(
      align === 'end'
        ? { top, right: Math.max(8, window.innerWidth - trigger.right) }
        : { top, left: Math.max(8, trigger.left) },
    );
  }, [align]);

  const openMenu = (focus: 'first' | 'last') => {
    focusOnOpen.current = focus;
    place();
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const list = items();
    (focusOnOpen.current === 'first' ? list[0] : list[list.length - 1])?.focus({ preventScroll: true });
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    // Follow the trigger while the page scrolls; close once it has scrolled out of view.
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger || trigger.bottom < 0 || trigger.top > window.innerHeight) close(false);
      else place();
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open, close, place]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const move = (next: number) => {
      event.preventDefault();
      list[(next + list.length) % list.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return move(index + 1);
      case 'ArrowUp':
        return move(index - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(list.length - 1);
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        return close(true);
      case 'Tab':
        return close(false);
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const match = list.findIndex((el, i) => i > index && el.textContent?.trim().toLowerCase().startsWith(event.key.toLowerCase()));
          const wrapped = match >= 0 ? match : list.findIndex((el) => el.textContent?.trim().toLowerCase().startsWith(event.key.toLowerCase()));
          if (wrapped >= 0) move(wrapped);
        }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu('first'))}
        onKeyDown={onTriggerKeyDown}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            className="menu"
            style={{ top: position?.top, left: position?.left, right: position?.right }}
            onKeyDown={onMenuKeyDown}
          >
            {header}
            {entries.map((entry) => {
              if (entry.type === 'separator') return <div key={entry.id} role="separator" className="menu__separator" />;
              if (entry.type === 'label')
                return (
                  <div key={entry.id} className="menu__label" role="presentation">
                    {entry.label}
                  </div>
                );
              const Icon = entry.icon;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role={radio || entry.checked !== undefined ? 'menuitemradio' : 'menuitem'}
                  aria-checked={entry.checked}
                  tabIndex={-1}
                  className={`menu__item${entry.danger ? ' menu__item--danger' : ''}`}
                  onClick={() => {
                    close(true);
                    entry.onSelect();
                  }}
                >
                  {Icon && <Icon size={16} className="menu__icon" aria-hidden="true" />}
                  <span className="menu__text">{entry.label}</span>
                  {entry.checked && <Check size={16} className="menu__check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
