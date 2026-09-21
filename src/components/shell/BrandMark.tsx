export const APP_NAME = 'HR Portal';

/** Logo: two overlapping speech bubbles with a spark, on the brand gradient. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
      <defs>
        <linearGradient id="brand-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-gradient)" />
      <path d="M9 11.5A3.5 3.5 0 0 1 12.5 8h7A3.5 3.5 0 0 1 23 11.5v4a3.5 3.5 0 0 1-3.5 3.5H15l-3.6 2.7a.6.6 0 0 1-.96-.48V18.6A3.5 3.5 0 0 1 9 15.5z" fill="#fff" fillOpacity=".95" />
      <path d="m16 10.4.83 1.9 1.97.2-1.49 1.3.43 1.95L16 14.73l-1.74 1.02.43-1.95-1.49-1.3 1.97-.2z" fill="#6366f1" />
    </svg>
  );
}
