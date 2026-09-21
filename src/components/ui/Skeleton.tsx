import type { CSSProperties } from 'react';
import { useI18n } from '../../i18n/context';
import './Skeleton.css';

export function Skeleton({ width, height = 12, radius, style }: { width?: number | string; height?: number | string; radius?: number | string; style?: CSSProperties }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

/** Announces loading once for screen readers while the placeholders render. */
export function LoadingRegion({ children, label }: { children: React.ReactNode; label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="loading-region">
      <span className="visually-hidden">{label ?? t('common.loading')}</span>
      {children}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <LoadingRegion>
      <ul className="skeleton-list">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="skeleton-list__item">
            <Skeleton width={36} height={36} radius="50%" />
            <span className="skeleton-list__text">
              <Skeleton width={`${40 + ((i * 17) % 30)}%`} height={12} />
              <Skeleton width={`${70 + ((i * 11) % 25)}%`} height={10} />
            </span>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  );
}

export function SkeletonTable({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <LoadingRegion>
      <div className="skeleton-table">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="skeleton-table__row">
            <Skeleton width={28} height={28} radius="50%" />
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton key={c} width={`${50 + ((r * 7 + c * 13) % 40)}%`} height={10} />
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
