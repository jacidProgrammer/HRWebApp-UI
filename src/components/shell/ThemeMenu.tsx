import { Monitor, Moon, Sun } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { MenuButton } from '../ui/Menu';

export function ThemeMenu() {
  const { t } = useI18n();
  const { preference, resolved, setPreference } = useTheme();
  const Icon = resolved === 'dark' ? Moon : Sun;
  return (
    <MenuButton
      label={t('theme.label')}
      radio
      entries={[
        { id: 'light', label: t('theme.light'), icon: Sun, checked: preference === 'light', onSelect: () => setPreference('light') },
        { id: 'dark', label: t('theme.dark'), icon: Moon, checked: preference === 'dark', onSelect: () => setPreference('dark') },
        { id: 'system', label: t('theme.system'), icon: Monitor, checked: preference === 'system', onSelect: () => setPreference('system') },
      ]}
    >
      <Icon size={18} aria-hidden="true" />
    </MenuButton>
  );
}
