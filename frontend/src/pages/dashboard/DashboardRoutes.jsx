import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import OrganizationProfilePage from './OrganizationProfilePage';
import OrganizerEventsPage from './OrganizerEventsPage';
import OrganizerMediaPage from './OrganizerMediaPage';
import OrganizerEventCreatePage from './OrganizerEventCreatePage';
import OrganizerEventEditPage from './OrganizerEventEditPage';
import OrganizerLocationsPage from './OrganizerLocationsPage';
import OrganizerArchivePage from './OrganizerArchivePage';
import OrganizerGuidelinesPage from './OrganizerGuidelinesPage';
import EditorEventsPage from './EditorEventsPage';
import EditorOrganizationsPage from './EditorOrganizationsPage';
import EditorLocationsPage from './EditorLocationsPage';
import EditorPlaceCreatePage from './EditorPlaceCreatePage';
import EditorPlaceEditPage from './EditorPlaceEditPage';
import EditorMediaPage from './EditorMediaPage';
import EditorGuidelinesPage from './EditorGuidelinesPage';
import EditorArchivePage from './EditorArchivePage';
import AdminOverviewPage from './AdminOverviewPage';
import AdminUsersPage from './AdminUsersPage';
import AdminSettingsPage from './AdminSettingsPage';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordPage from './ChangePasswordPage';

const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="/dashboard/events" replace />} />
        <Route path="organization" element={<OrganizationProfilePage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
        <Route path="password" element={<ChangePasswordPage />} />
        <Route path="events/new" element={<OrganizerEventCreatePage />} />
        <Route path="events/:id/edit" element={<OrganizerEventEditPage />} />
        <Route path="media" element={<OrganizerMediaPage />} />
        <Route path="places" element={<OrganizerLocationsPage />} />
        <Route path="places/new" element={<EditorPlaceCreatePage />} />
        <Route path="places/:id/edit" element={<EditorPlaceEditPage />} />
        <Route path="archive" element={<OrganizerArchivePage />} />
        <Route path="guidelines" element={<OrganizerGuidelinesPage />} />
        <Route
          path="editor/events"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorEventsPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/organizations"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorOrganizationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/places"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorLocationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/places/new"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorPlaceCreatePage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/places/:id/edit"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorPlaceEditPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/media"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorMediaPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/guidelines"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorGuidelinesPage />
            </RoleGuard>
          }
        />
        <Route
          path="editor/archive"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorArchivePage />
            </RoleGuard>
          }
        />
        <Route
          path="admin"
          element={
            <RoleGuard roles={['admin']}>
              <AdminOverviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleGuard roles={['admin']}>
              <AdminUsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="admin/settings"
          element={
            <RoleGuard roles={['admin']}>
              <AdminSettingsPage />
            </RoleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

const RoleGuard = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default DashboardRoutes;
