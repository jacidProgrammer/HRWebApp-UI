import { NavLink, Outlet } from 'react-router-dom';
import { Role } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { APP_NAME } from '../hooks/useDocumentTitle';

const navClass = ({ isActive }: { isActive: boolean }) => `nav__link${isActive ? ' nav__link--active' : ''}`;

export function Layout() {
  const { user, hasRole, logout } = useAuth();
  const isEmployee = hasRole(Role.EMPLOYEE);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/employees" className="brand">
            <span className="brand__mark" aria-hidden="true">
              HR
            </span>
            <span className="brand__name">{APP_NAME}</span>
          </NavLink>

          <nav className="nav" aria-label="Main">
            <NavLink to="/employees" className={navClass}>
              Employees
            </NavLink>
            {isEmployee && (
              <NavLink to="/feedback" className={navClass}>
                Feedback
              </NavLink>
            )}
            {isEmployee && (
              <NavLink to="/profile" className={navClass}>
                My profile
              </NavLink>
            )}
          </nav>

          <div className="account">
            <div className="account__who">
              <span className="account__name">{user.displayName}</span>
              <span className="account__roles">
                {user.roles.length ? (
                  user.roles.map((role) => (
                    <span key={role} className={`role-tag role-tag--${role.toLowerCase()}`}>
                      {role.toLowerCase()}
                    </span>
                  ))
                ) : (
                  <span className="role-tag">no role</span>
                )}
              </span>
            </div>
            <button type="button" className="button button--small" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {user.roles.length === 0 && (
          <div className="alert alert--warning" role="alert">
            <p className="alert__message">
              Your account has neither the MANAGER nor the EMPLOYEE role, so the API will refuse your requests. Ask an
              administrator to assign a role in Keycloak.
            </p>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="footer">
        Signed in as <strong>{user.username}</strong> · HRWebApp demo
      </footer>
    </div>
  );
}
