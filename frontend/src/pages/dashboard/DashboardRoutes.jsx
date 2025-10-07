import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import OrganizerDashboardPage from './OrganizerDashboardPage';
import OrganizationProfilePage from './OrganizationProfilePage';
import OrganizerEventsPage from './OrganizerEventsPage';
import OrganizerMediaPage from './OrganizerMediaPage';

const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OrganizerDashboardPage />} />
        <Route path="organization" element={<OrganizationProfilePage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
        <Route path="media" element={<OrganizerMediaPage />} />
        <Route path="" element={<OrganizerDashboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DashboardRoutes;
