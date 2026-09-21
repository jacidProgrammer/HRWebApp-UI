import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeesApi } from '../api/employees';
import type { EmployeeInput } from '../api/types';
import { EmployeeForm } from '../components/EmployeeForm';
import { PageHeader } from '../components/PageHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useEmployees } from '../hooks/useEmployees';
import { compareText } from '../lib/format';

export function EmployeeCreatePage() {
  useDocumentTitle('New employee');
  const navigate = useNavigate();
  const employees = useEmployees();
  const departments = useMemo(
    () => [...new Set((employees.data ?? []).map((e) => e.department))].sort(compareText),
    [employees.data],
  );

  const create = async (input: EmployeeInput) => {
    const created = await employeesApi.create(input);
    await navigate(`/employees/${encodeURIComponent(created.name)}`, {
      state: { notice: `${created.name} was added to the directory.` },
    });
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New employee</span>
      </nav>
      <PageHeader title="New employee" description="All fields are required." />
      <section className="panel">
        <EmployeeForm mode="create" departments={departments} onSubmit={create} cancelTo="/employees" />
      </section>
    </>
  );
}
