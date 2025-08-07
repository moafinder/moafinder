import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchOverlay from './components/SearchOverlay';
import ArrowUp from './components/ArrowUp';

import HomePage from './pages/HomePage';
import PlaceProfile from './pages/PlaceProfile';
import EntriesList from './pages/EntriesList';
import EntryDetail from './pages/EntryDetail';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FormatsPage from './pages/FormatsPage';

/**
 * Main application component. Defines high‑level layout and routes.
 * The navbar and footer persist across pages, while the Routes
 * component determines which page is rendered based on the URL.
 */
function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isVisible={searchOpen} onClose={() => setSearchOpen(false)} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/place/:id" element={<PlaceProfile />} />
          <Route path="/entries" element={<EntriesList />} />
          <Route path="/entries/:id" element={<EntryDetail />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/formats" element={<FormatsPage />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-3xl font-bold">404 – Seite nicht gefunden</h1>
                <p className="mt-4">Die angeforderte Seite existiert nicht.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <ArrowUp />
      <Footer />
    </div>
  );
}

export default App;