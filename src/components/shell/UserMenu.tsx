import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../../auth/user';
import { useI18n } from '../../i18n/context';
import { LANGUAGE_NAMES, LOCALES } from '../../i18n/core';
import { Avatar } from '../ui/Avatar';
import { MenuButton, type MenuEntry } from '../ui/Menu';

export function UserMenu({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const roleLabel = user.roles.length ? user.roles.map((role) => t(`role.${role}`)).join(' · ') : t('role.none');

  const entries: MenuEntry[] = [
    ...(user.roles.includes('EMPLOYEE')
      ? [{ id: 'profile', label: t('nav.profile'), icon: UserRound, onSelect: () => void navigate('/profile') }, { type: 'separator' as const, id: 's0' }]
      : []),
    { type: 'label', id: 'language', label: t('menu.language') },
    ...LOCALES.map((code) => ({
      id: `lang-${code}`,
      label: LANGUAGE_NAMES[code],
      checked: code === locale,
      onSelect: () => setLocale(code),
    })),
    { type: 'separator', id: 's1' },
    { id: 'signout', label: t('menu.signOut'), icon: LogOut, onSelect: onSignOut },
  ];

  return (
    <MenuButton
      label={t('menu.account', { name: user.displayName })}
      triggerClassName="user-trigger"
      entries={entries}
      header={
        <div className="user-menu__header">
          <Avatar name={user.displayName} size="md" />
          <div className="user-menu__who">
            <span className="user-menu__name">{user.displayName}</span>
            <span className="user-menu__meta">@{user.username}</span>
          </div>
        </div>
      }
    >
      <Avatar name={user.displayName} size="sm" />
      <span className="user-trigger__text">
        <span className="user-trigger__name">{user.displayName}</span>
        <span className="user-trigger__role">{roleLabel}</span>
      </span>
      <ChevronDown size={16} className="user-trigger__chevron" aria-hidden="true" />
    </MenuButton>
  );
}
