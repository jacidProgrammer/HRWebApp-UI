import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'accent' | 'danger';
  headingLevel?: 1 | 2 | 3;
  compact?: boolean;
}

/** Friendly placeholder: an icon on soft concentric rings, a short title, one sentence and an action. */
export function EmptyState({ icon: Icon, title, children, action, tone = 'accent', headingLevel = 2, compact = false }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={`empty-state empty-state--${tone}${compact ? ' empty-state--compact' : ''}`}>
      <div className="empty-state__art" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="empty-state__rings">
          <circle cx="60" cy="60" r="58" />
          <circle cx="60" cy="60" r="44" />
          <circle cx="60" cy="60" r="30" />
        </svg>
        <span className="empty-state__icon">
          <Icon size={22} />
        </span>
      </div>
      <Heading className="empty-state__title">{title}</Heading>
      {children && <p className="empty-state__body">{children}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
