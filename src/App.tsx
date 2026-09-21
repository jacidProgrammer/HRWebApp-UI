import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './auth/RequireRole';
import { Role } from './auth/roles';
import { Layout } from './components/Layout';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeeEditPage } from './pages/EmployeeEditPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

const ANY_ROLE = [Role.MANAGER, Role.EMPLOYEE] as const;

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/employees" replace />} />
        <Route
          path="employees"
          element={
            <RequireRole anyOf={ANY_ROLE}>
              <EmployeesPage />
            </RequireRole>
          }
        />
        <Route
          path="employees/new"
          element={
            <RequireRole anyOf={[Role.MANAGER]}>
              <EmployeeCreatePage />
            </RequireRole>
          }
        />
        <Route
          path="employees/:name"
          element={
            <RequireRole anyOf={ANY_ROLE}>
              <EmployeeDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="employees/:name/edit"
          element={
            <RequireRole anyOf={[Role.MANAGER]}>
              <EmployeeEditPage />
            </RequireRole>
          }
        />
        <Route
          path="profile"
          element={
            <RequireRole anyOf={[Role.EMPLOYEE]}>
              <MyProfilePage />
            </RequireRole>
          }
        />
        <Route
          path="feedback"
          element={
            <RequireRole anyOf={[Role.EMPLOYEE]}>
              <FeedbackPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
