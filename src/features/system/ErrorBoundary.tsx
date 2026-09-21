import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Bug, RotateCw } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useI18n } from '../../i18n/context';

function Fallback() {
  const { t } = useI18n();
  return (
    <div role="alert">
      <EmptyState
        icon={Bug}
        tone="danger"
        title={t('crash.title')}
        action={
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            <RotateCw size={16} aria-hidden="true" />
            {t('crash.reload')}
          </button>
        }
      >
        {t('crash.body')}
      </EmptyState>
    </div>
  );
}

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the path) clears the error, so navigating away recovers. */
  resetKey?: string;
  /** Rendered instead of the default fallback, e.g. outside the i18n provider. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
  resetKey?: string;
}

/** Catches render errors so one broken page doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (this.state.error) return this.props.fallback ?? <Fallback />;
    return this.props.children;
  }
}
