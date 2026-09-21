import { BriefcaseBusiness, ChevronRight, UserRound } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { setAuthHandlers } from '../api/http';
import { BrandMark } from '../components/shell/BrandMark';
import { Avatar } from '../components/ui/Avatar';
import { useI18n } from '../i18n/context';
import { LANGUAGE_NAMES, LOCALES, type Locale } from '../i18n/core';
import { readStorage, writeStorage } from '../lib/storage';
import { findPersona, MOCK_PERSONAS, mockToken, type MockPersona } from '../mocks/personas';
import { AuthContext } from './AuthContext';
import { createAuthValue } from './createAuthValue';
import './MockAuthProvider.css';

export const MOCK_USER_STORAGE_KEY = 'hr.mockUser';

function connect(persona: MockPersona) {
  setAuthHandlers({ getToken: () => Promise.resolve(mockToken(persona.username)), onUnauthorized: () => undefined });
}

/** Demo mode: no Keycloak. The visitor picks a role and the in-browser mock API trusts that choice. */
export default function MockAuthProvider({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const [persona, setPersona] = useState<MockPersona | undefined>(() => {
    const stored = findPersona(readStorage(MOCK_USER_STORAGE_KEY, 'session'));
    if (stored) connect(stored);
    return stored;
  });

  const choose = useCallback((next: MockPersona) => {
    connect(next);
    writeStorage(MOCK_USER_STORAGE_KEY, next.username, 'session');
    setPersona(next);
  }, []);

  const value = useMemo(() => {
    if (!persona) return null;
    const user = { username: persona.username, displayName: persona.displayName, email: null, roles: persona.roles };
    return createAuthValue(user, () => {
      writeStorage(MOCK_USER_STORAGE_KEY, null, 'session');
      window.history.replaceState(null, '', '/');
      setPersona(undefined);
    });
  }, [persona]);

  if (value) return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

  const manager = MOCK_PERSONAS[0];
  const employee = MOCK_PERSONAS[1];
  const others = MOCK_PERSONAS.slice(2);

  return (
    <main className="role-picker">
      <div className="role-picker__card">
        <div className="role-picker__brand">
          <BrandMark size={40} />
          <div className="role-picker__tools">
            <span className="badge badge--demo">{t('demo.badge')}</span>
            <select
              className="input role-picker__language"
              aria-label={t('menu.language')}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {LOCALES.map((code) => (
                <option key={code} value={code} lang={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <h1 className="role-picker__title">{t('demo.picker.title')}</h1>
        <p className="role-picker__lead">{t('demo.picker.lead')}</p>

        <div className="role-picker__options">
          {manager && (
            <button type="button" className="role-option" onClick={() => choose(manager)}>
              <span className="role-option__icon role-option__icon--manager" aria-hidden="true">
                <BriefcaseBusiness size={20} />
              </span>
              <span className="role-option__text">
                <span className="role-option__title">{t('demo.picker.manager')}</span>
                <span className="role-option__hint">{t('demo.picker.managerHint')}</span>
              </span>
              <ChevronRight className="role-option__chevron" size={18} aria-hidden="true" />
            </button>
          )}
          {employee && (
            <button type="button" className="role-option" onClick={() => choose(employee)}>
              <span className="role-option__icon role-option__icon--employee" aria-hidden="true">
                <UserRound size={20} />
              </span>
              <span className="role-option__text">
                <span className="role-option__title">{t('demo.picker.employee')}</span>
                <span className="role-option__hint">{t('demo.picker.employeeHint', { name: employee.displayName })}</span>
              </span>
              <ChevronRight className="role-option__chevron" size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="role-picker__others">
          <span>{t('demo.picker.others')}</span>
          <ul>
            {others.map((other) => (
              <li key={other.username}>
                <button type="button" className="chip-button" onClick={() => choose(other)}>
                  <Avatar name={other.displayName} size="xs" />
                  {other.displayName}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="role-picker__note">{t('demo.picker.note')}</p>
      </div>
    </main>
  );
}
