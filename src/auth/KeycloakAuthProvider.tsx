import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthHandlers } from '../api/http';
import { Splash } from '../components/shell/Splash';
import { config } from '../config';
import { useI18n } from '../i18n/context';
import { AuthContext } from './AuthContext';
import { createAuthValue } from './createAuthValue';
import { getFreshToken, initKeycloak, keycloak, login, logout, MIN_TOKEN_VALIDITY_SECONDS } from './keycloak';
import { userFromToken, type AuthUser } from './user';

type AuthState = { status: 'loading' } | { status: 'authenticated'; user: AuthUser } | { status: 'error' };

/** Signs the user in with Keycloak before rendering the app, keeps the token fresh and wires the API client. */
export function KeycloakAuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
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
      <Splash
        tone="error"
        title={t('auth.unreachable.title')}
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setState({ status: 'loading' });
              setAttempt((n) => n + 1);
            }}
          >
            {t('common.tryAgain')}
          </button>
        }
      >
        {t('auth.unreachable.body', { url: config.keycloak.url, realm: config.keycloak.realm })}
      </Splash>
    );
  }

  if (!value) {
    return <Splash tone="loading" title={t('auth.signingIn')} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
