import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import OrganizerDashboardPage from './OrganizerDashboardPage';
import OrganizationProfilePage from './OrganizationProfilePage';
import OrganizerEventsPage from './OrganizerEventsPage';
import OrganizerMediaPage from './OrganizerMediaPage';
import OrganizerEventCreatePage from './OrganizerEventCreatePage';
import OrganizerEventEditPage from './OrganizerEventEditPage';
import EditorEventsPage from './EditorEventsPage';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OrganizerDashboardPage />} />
        <Route path="organization" element={<OrganizationProfilePage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
        <Route path="events/new" element={<OrganizerEventCreatePage />} />
        <Route path="events/:id/edit" element={<OrganizerEventEditPage />} />
        <Route path="media" element={<OrganizerMediaPage />} />
        <Route path="" element={<OrganizerDashboardPage />} />
        <Route
          path="editor/events"
          element={
            <RoleGuard roles={['editor', 'admin']}>
              <EditorEventsPage />
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
