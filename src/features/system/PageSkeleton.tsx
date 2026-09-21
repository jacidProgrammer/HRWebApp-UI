import { LoadingRegion, Skeleton } from '../../components/ui/Skeleton';

/** Placeholder while a lazily loaded page arrives. */
export function PageSkeleton() {
  return (
    <LoadingRegion>
      <div className="page">
        <Skeleton width="40%" height={14} />
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={112} radius={12} />
          ))}
        </div>
        <Skeleton height={280} radius={12} />
      </div>
    </LoadingRegion>
  );
}
