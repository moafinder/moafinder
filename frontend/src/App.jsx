import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FormatsPage from './pages/FormatsPage';
import PlacesPage from './pages/PlacesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import EventDetail from './pages/EventDetail';
import PlaceProfile from './pages/PlaceProfile';
import EventsList from './pages/EventsList';
import EventCreate from './pages/EventCreate';
import EventEdit from './pages/EventEdit';
import DashboardRoutes from './pages/dashboard/DashboardRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboard && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<FormatsPage />} />
          <Route path="/formate" element={<FormatsPage />} />
          <Route path="/orte" element={<PlacesPage />} />
          <Route path="/place/:id" element={<PlaceProfile />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/kontakt" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/new" element={<EventCreate />} />
          <Route path="/events/:id/edit" element={<EventEdit />} />
          <Route
            path="/dashboard/*"
            element={(
              <ProtectedRoute>
                <DashboardRoutes />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      <ScrollToTop />
    </div>
  );
}

export default App;
