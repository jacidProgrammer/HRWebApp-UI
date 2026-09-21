import type { ReactNode } from 'react';
import type { Employee } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { DepartmentChip } from '../../components/ui/Chips';
import './PersonHeader.css';

/** Profile banner: large avatar, name, role, department and username, with page actions on the right. */
export function PersonHeader({ employee, badge, actions }: { employee: Employee; badge?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="person-header card" aria-labelledby="person-name">
      <div className="person-header__cover" aria-hidden="true" />
      <div className="person-header__body">
        <div className="person-header__avatar">
          <Avatar name={employee.name} size="xl" />
        </div>
        <div className="person-header__text">
          <h2 id="person-name" className="person-header__name">
            {employee.name} {badge}
          </h2>
          <p className="person-header__role">
            {employee.role} <span className="muted">· @{employee.username}</span>
          </p>
          <DepartmentChip department={employee.department} />
        </div>
        {actions && <div className="person-header__actions">{actions}</div>}
      </div>
    </section>
  );
}
