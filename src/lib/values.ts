import { Gem, HeartHandshake, Flag, Sprout, UsersRound, type LucideIcon } from 'lucide-react';
import type { CompanyValue } from '../api/types';
import type { MessageKey } from '../i18n/core';

export const VALUE_META: Record<CompanyValue, { icon: LucideIcon; label: MessageKey; hint: MessageKey }> = {
  TEAMWORK: { icon: UsersRound, label: 'value.TEAMWORK', hint: 'value.TEAMWORK.hint' },
  OWNERSHIP: { icon: Flag, label: 'value.OWNERSHIP', hint: 'value.OWNERSHIP.hint' },
  CRAFT: { icon: Gem, label: 'value.CRAFT', hint: 'value.CRAFT.hint' },
  CUSTOMER_FOCUS: { icon: HeartHandshake, label: 'value.CUSTOMER_FOCUS', hint: 'value.CUSTOMER_FOCUS.hint' },
  GROWTH: { icon: Sprout, label: 'value.GROWTH', hint: 'value.GROWTH.hint' },
};
