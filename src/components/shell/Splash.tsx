import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import './Splash.css';

interface SplashProps {
  title: string;
  tone: 'loading' | 'error';
  children?: ReactNode;
  action?: ReactNode;
}

/** Full-screen state before the app shell exists (signing in, sign-in service unreachable). */
export function Splash({ title, tone, children, action }: SplashProps) {
  return (
    <main className={`splash splash--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <BrandMark size={44} />
      {tone === 'loading' && <span className="splash__progress" aria-hidden="true" />}
      <h1 className="splash__title">{title}</h1>
      {children && <p className="splash__body">{children}</p>}
      {action}
    </main>
  );
}
