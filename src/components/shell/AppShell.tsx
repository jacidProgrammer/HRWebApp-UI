import { FlaskConical, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Send, X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { config } from '../../config';
import { useI18n } from '../../i18n/context';
import { readStorage, writeStorage } from '../../lib/storage';
import { ErrorBoundary } from '../../features/system/ErrorBoundary';
import { PageSkeleton } from '../../features/system/PageSkeleton';
import { trapFocus } from '../ui/focus';
import { APP_NAME, BrandMark } from './BrandMark';
import { navigationFor } from './navigation';
import { PageTitleContext } from './pageTitle';
import { ThemeMenu } from './ThemeMenu';
import { UserMenu } from './UserMenu';
import './AppShell.css';

const COLLAPSED_KEY = 'hr.sidebar.collapsed';

function Sidebar({ collapsed, onNavigate, id }: { collapsed: boolean; onNavigate?: () => void; id?: string }) {
  const auth = useAuth();
  const { t } = useI18n();
  const sections = navigationFor(auth);
  const isEmployee = auth.hasRole('EMPLOYEE');

  return (
    <div className="sidebar__inner" id={id}>
      <Link to="/" className="sidebar__brand" onClick={onNavigate} aria-label={t('nav.home', { app: APP_NAME })}>
        <BrandMark size={32} />
        <span className="sidebar__brand-text">
          <span className="sidebar__brand-name">{APP_NAME}</span>
          <span className="sidebar__brand-tagline">{t('brand.tagline')}</span>
        </span>
      </Link>

      {isEmployee && (
        <Link
          to="/recognition/give"
          className="btn btn--primary sidebar__cta"
          onClick={onNavigate}
          aria-label={collapsed ? t('recognition.give') : undefined}
          title={collapsed ? t('recognition.give') : undefined}
        >
          <Send size={16} aria-hidden="true" />
          <span className="sidebar__label">{t('recognition.give')}</span>
        </Link>
      )}

      <nav className="sidebar__nav" aria-label={t('nav.main')}>
        {sections.map((section) => (
          <div key={section.label} className="sidebar__section">
            <p className="sidebar__section-label">{t(section.label)}</p>
            <ul>
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                    onClick={onNavigate}
                    title={collapsed ? t(label) : undefined}
                  >
                    <Icon size={18} className="sidebar__icon" aria-hidden="true" />
                    <span className="sidebar__label">{t(label)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

/**
 * App shell: a left sidebar (collapsible to icons on desktop, a drawer on small screens), a sticky top bar
 * with the page title, theme and account menus, and the routed page in <main>.
 */
export function AppShell() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [collapsed, setCollapsed] = useState(() => readStorage(COLLAPSED_KEY) === 'true');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      writeStorage(COLLAPSED_KEY, String(!value));
      return !value;
    });
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [drawerOpen]);

  // Close the drawer when the viewport grows past the breakpoint.
  useEffect(() => {
    const query = window.matchMedia?.('(min-width: 1024px)');
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => event.matches && setDrawerOpen(false);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const onDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') closeDrawer();
    else trapFocus(event, drawerRef.current);
  };

  return (
    <PageTitleContext.Provider value={setTitle}>
      <div className={`shell${collapsed ? ' shell--collapsed' : ''}`}>
        <a className="skip-link" href="#main">
          {t('nav.skip')}
        </a>

        <aside className="sidebar" aria-label={t('nav.sidebar')}>
          <Sidebar collapsed={collapsed} />
          <button
            type="button"
            className="sidebar__collapse btn btn--ghost btn--sm"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            title={collapsed ? t('nav.expand') : t('nav.collapse')}
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            <span className="sidebar__label">{t('nav.collapse')}</span>
          </button>
        </aside>

        {drawerOpen && (
          <div className="drawer" onMouseDown={closeDrawer}>
            <div
              ref={drawerRef}
              className="drawer__panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.sidebar')}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={onDrawerKeyDown}
            >
              <button type="button" className="btn btn--ghost btn--icon drawer__close" onClick={closeDrawer} aria-label={t('nav.closeMenu')}>
                <X size={18} aria-hidden="true" />
              </button>
              <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <div className="shell__main" inert={drawerOpen || undefined}>
          {config.authMode === 'mock' && (
            <div className="demo-banner" role="note">
              <FlaskConical size={14} aria-hidden="true" />
              <span>
                <strong>{t('demo.badge')}</strong>
                <span className="demo-banner__detail"> · {t('demo.banner')}</span>
              </span>
              <button type="button" className="demo-banner__switch" onClick={logout}>
                {t('demo.switchRole')}
              </button>
            </div>
          )}
          <header className="topbar">
            <button
              ref={menuButtonRef}
              type="button"
              className="btn btn--ghost btn--icon topbar__menu"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-expanded={drawerOpen}
            >
              <MenuIcon size={20} aria-hidden="true" />
            </button>
            <h1 className="topbar__title">{title}</h1>
            <div className="topbar__actions">
              <ThemeMenu />
              <UserMenu user={user} onSignOut={logout} />
            </div>
          </header>

          <main id="main" ref={mainRef} className="content" tabIndex={-1}>
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}
