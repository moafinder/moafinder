import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import pigeonWhite from '../assets/pigeon_white.png';
import searchIcon from '../assets/search_icon.png';

/**
 * Updated Navbar component matching Figma design specifications.
 * Key changes from requirements:
 * - White text that turns green (#7CB92C) on hover
 * - Dove logo links to /formate (start page)
 * - Search icon opens overlay when clicked
 * - Login becomes Logout when user is logged in
 */
const Navbar = ({ onSearchOpen, isLoggedIn = false, userRole = null, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom NavLink with proper hover styling per requirements
  const NavItem = ({ to, children, external = false }) => {
    if (external) {
      return (
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-medium transition-colors duration-300 hover:text-[#7CB92C]"
        >
          {children}
        </a>
      );
    }

    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `text-white font-medium transition-colors duration-300 hover:text-[#7CB92C] ${
            isActive ? 'border-b-2 border-[#7CB92C] pb-1' : ''
          }`
        }
      >
        {children}
      </NavLink>
    );
  };

  return (
    <header className="bg-black sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Dove Logo - always links to Formate (start page) */}
          <Link 
            to="/formate" 
            className="flex items-center group"
          >
            <img 
              src={pigeonWhite} 
              alt="MoaFinder" 
              className="h-10 w-auto transition-all duration-300 group-hover:brightness-0 group-hover:invert group-hover:sepia group-hover:saturate-[1000%] group-hover:hue-rotate-[50deg]"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavItem to="/formate">Formate</NavItem>
            <NavItem to="/orte">Orte</NavItem>
            <NavItem to="/kontakt">Kontakt</NavItem>
            <NavItem to="https://moabit.world" external>moabit.world</NavItem>
            <NavItem to="/kiezmedium">Kiezmedium</NavItem>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button
              onClick={onSearchOpen}
              className="p-2 text-white hover:text-[#7CB92C] transition-colors duration-300"
              aria-label="Suche öffnen"
            >
              <img 
                src={searchIcon} 
                alt="Suche" 
                className="h-5 w-5 invert brightness-0 hover:brightness-0 hover:sepia hover:saturate-[1000%] hover:hue-rotate-[50deg]"
              />
            </button>

            {/* Login/Logout Button */}
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-white font-medium hover:text-[#7CB92C] transition-colors duration-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 text-white font-medium hover:text-[#7CB92C] transition-colors duration-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                <span>Login</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-[#7CB92C] transition-colors duration-300"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-3">
              <NavItem to="/formate">Formate</NavItem>
              <NavItem to="/orte">Orte</NavItem>
              <NavItem to="/kontakt">Kontakt</NavItem>
              <NavItem to="https://moabit.world" external>moabit.world</NavItem>
              <NavItem to="/kiezmedium">Kiezmedium</NavItem>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;