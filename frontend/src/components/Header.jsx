import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import SearchOverlay from './SearchOverlay';
import pigeonWhite from '../assets/pigeon_white.png';

const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = useMemo(
    () => [
      {
        label: 'Events',
        to: '/formate',
        match: ['/', '/formate'],
      },
      {
        label: 'Orte',
        to: '/orte',
        match: ['/orte', '/place'],
      },
      {
        label: 'Kontakt',
        to: '/kontakt',
      },
      {
        label: 'moabit.world',
        to: 'https://moabit.world',
        external: true,
      },
      {
        label: 'Moazin',
        to: 'https://www.moazin.de/',
        external: true,
      },
    ],
    [],
  );

  const linkClass = (item) => {
    const base = 'font-medium transition-colors';

    if (item.external) {
      return `${base} text-white hover:text-green-400`;
    }

    const matchPaths = item.match ?? [item.to];
    const isActive = matchPaths.some((path) => {
      if (path === '/') {
        return location.pathname === '/';
      }
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    });

    return isActive ? `${base} text-green-400` : `${base} text-white hover:text-green-400`;
  };

  return (
    <>
      <header className="bg-black text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/formate" className="flex items-center space-x-2">
              <img src={pigeonWhite} alt="MoaFinder" className="h-10 w-auto hover:opacity-80 transition-opacity" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass(item)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} to={item.to} className={linkClass(item)}>
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            {/* Search, Login, and Mobile Menu Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSearch(true)}
                className="text-white hover:text-green-400 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Suche öffnen"
              >
                <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
              </button>
              
              {/* Desktop auth links */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="font-medium text-white hover:text-green-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="font-medium text-white hover:text-green-400 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="font-medium text-white hover:text-green-400 transition-colors">
                    Login
                  </Link>
                )}
              </div>
              
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:text-green-400 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Collapsible */}
          {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-700 animate-fadeIn">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass(item)} py-2 min-h-[44px] flex items-center touch-manipulation`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link 
                    key={item.label} 
                    to={item.to} 
                    className={`${linkClass(item)} py-2 min-h-[44px] flex items-center touch-manipulation`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ),
              )}
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="font-medium text-white transition-colors hover:text-green-400 py-2 min-h-[44px] flex items-center touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="font-medium text-white transition-colors hover:text-green-400 py-2 min-h-[44px] flex items-center touch-manipulation text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="font-medium text-white transition-colors hover:text-green-400 py-2 min-h-[44px] flex items-center touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
          )}
        </div>
      </header>

      {/* Search Overlay */}
      {showSearch && <SearchOverlay isVisible={showSearch} onClose={() => setShowSearch(false)} />}
    </>
  );
};

export default Header;
