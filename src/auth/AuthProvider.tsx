import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthHandlers } from '../api/http';
import { config } from '../config';
import { AuthContext } from './AuthContext';
import { createAuthValue } from './createAuthValue';
import { getFreshToken, initKeycloak, keycloak, login, logout, MIN_TOKEN_VALIDITY_SECONDS } from './keycloak';
import { userFromToken, type AuthUser } from './user';

type AuthState = { status: 'loading' } | { status: 'authenticated'; user: AuthUser } | { status: 'error' };

/**
 * Signs the user in with Keycloak before rendering the app, keeps the token fresh and wires the API
 * client to it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    initKeycloak()
      .then((authenticated) => {
        if (!active) return;
        if (!authenticated) {
          login();
          return;
        }
        setAuthHandlers({ getToken: getFreshToken, onUnauthorized: login });
        keycloak.onTokenExpired = () => {
          keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS).catch(login);
        };
        setState({ status: 'authenticated', user: userFromToken(keycloak.tokenParsed) });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const value = useMemo(
    () => (state.status === 'authenticated' ? createAuthValue(state.user, logout) : null),
    [state],
  );

  if (state.status === 'error') {
    return (
      <div className="splash" role="alert">
        <h1 className="splash__title">Cannot reach the sign-in service</h1>
        <p>
          Keycloak did not respond at <code>{config.keycloak.url}</code> (realm <code>{config.keycloak.realm}</code>).
          Make sure the backend&apos;s <code>docker compose</code> stack is running.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            setState({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="splash" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Signing you in…</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
