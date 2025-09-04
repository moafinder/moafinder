import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FormatsPage from './pages/FormatsPage';
import PlacesPage from './pages/PlacesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetail from './pages/EventDetail';
import PlaceProfile from './pages/PlaceProfile';
import NotesPage from './pages/NotesPage';
import EventsList from './pages/EventsList';
import EventCreate from './pages/EventCreate';
import EventEdit from './pages/EventEdit';
import './App.css';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<FormatsPage />} />
          <Route path="/formate" element={<FormatsPage />} />
          <Route path="/orte" element={<PlacesPage />} />
          <Route path="/place/:id" element={<PlaceProfile />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/kontakt" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/new" element={<EventCreate />} />
          <Route path="/events/:id/edit" element={<EventEdit />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;
