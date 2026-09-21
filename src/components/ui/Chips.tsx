import type { CompanyValue } from '../../api/types';
import { useI18n } from '../../i18n/context';
import { departmentColorIndex } from '../../lib/colors';
import { VALUE_META } from '../../lib/values';
import './Chips.css';

export function DepartmentChip({ department }: { department: string }) {
  return <span className={`chip chip--dept chip--d${departmentColorIndex(department)}`}>{department}</span>;
}

export function ValueTag({ value, size = 'md' }: { value: CompanyValue; size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const { icon: Icon, label } = VALUE_META[value];
  return (
    <span className={`chip chip--value chip--${value.toLowerCase()} chip--${size}`}>
      <Icon className="chip__icon" aria-hidden="true" />
      {t(label)}
    </span>
  );
}
