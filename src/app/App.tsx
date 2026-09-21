import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireRole } from '../auth/RequireRole';
import type { Role } from '../auth/roles';
import { AppShell } from '../components/shell/AppShell';
import { PeoplePage } from '../features/people/PeoplePage';
import { PersonPage } from '../features/people/PersonPage';
import { MyProfilePage } from '../features/profile/MyProfilePage';
import { GiveRecognitionPage } from '../features/recognition/GiveRecognitionPage';
import { MyRecognitionPage } from '../features/recognition/MyRecognitionPage';
import { HomeRedirect } from '../features/system/HomeRedirect';
import { NotFoundPage } from '../features/system/NotFoundPage';

// Manager-only pages are split into their own chunks: employees never download them.
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const FeedbackExplorerPage = lazy(() => import('../features/feedback/FeedbackExplorerPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const PersonCreatePage = lazy(() => import('../features/people/PersonCreatePage'));
const PersonEditPage = lazy(() => import('../features/people/PersonEditPage'));

const ANYONE: Role[] = ['MANAGER', 'EMPLOYEE'];
const MANAGER: Role[] = ['MANAGER'];
const EMPLOYEE: Role[] = ['EMPLOYEE'];

const guard = (roles: Role[], page: React.ReactNode) => <RequireRole anyOf={roles}>{page}</RequireRole>;

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={guard(MANAGER, <DashboardPage />)} />
        <Route path="people" element={guard(ANYONE, <PeoplePage />)} />
        <Route path="people/new" element={guard(MANAGER, <PersonCreatePage />)} />
        <Route path="people/:id" element={guard(ANYONE, <PersonPage />)} />
        <Route path="people/:id/edit" element={guard(MANAGER, <PersonEditPage />)} />
        <Route path="feedback" element={guard(MANAGER, <FeedbackExplorerPage />)} />
        <Route path="settings" element={guard(MANAGER, <SettingsPage />)} />
        <Route path="recognition" element={guard(EMPLOYEE, <MyRecognitionPage />)} />
        <Route path="recognition/give" element={guard(EMPLOYEE, <GiveRecognitionPage />)} />
        <Route path="profile" element={guard(EMPLOYEE, <MyProfilePage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
