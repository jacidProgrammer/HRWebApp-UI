import { Award, BookUser, LayoutDashboard, MessagesSquare, Settings, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import type { AuthContextValue } from '../../auth/AuthContext';
import type { MessageKey } from '../../i18n/core';

export interface NavItem {
  to: string;
  label: MessageKey;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavSection {
  label: MessageKey;
  items: NavItem[];
}

export function navigationFor(auth: Pick<AuthContextValue, 'hasRole'>): NavSection[] {
  const sections: NavSection[] = [];
  if (auth.hasRole('MANAGER')) {
    sections.push({
      label: 'nav.section.insights',
      items: [
        { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
        { to: '/people', label: 'nav.people', icon: UsersRound },
        { to: '/feedback', label: 'nav.feedback', icon: MessagesSquare },
        { to: '/settings', label: 'nav.settings', icon: Settings },
      ],
    });
  }
  if (auth.hasRole('EMPLOYEE')) {
    sections.push({
      label: 'nav.section.me',
      items: [
        { to: '/recognition', label: 'nav.recognition', icon: Award, end: true },
        ...(auth.hasRole('MANAGER') ? [] : [{ to: '/people', label: 'nav.directory' as const, icon: BookUser }]),
        { to: '/profile', label: 'nav.profile', icon: UserRound },
      ],
    });
  }
  return sections;
}
