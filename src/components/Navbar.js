import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import pigeonWhite from '../assets/pigeon_white.png';
import searchIcon from '../assets/search_icon.png';

/**
 * Responsive navigation bar. Displays a brand/logo on the left and
 * navigation links on the right. On smaller screens the links are
 * collapsed behind a hamburger menu. NavLink is used so the active
 * link receives an underline and highlight styling automatically.
 */
const Navbar = ({ onSearchOpen }) => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  // Render a single nav item. The to property defines the target
  // route. Additional styling is applied based on whether the link
  // matches the current URL (active state).
  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block py-2 md:py-0 md:px-4 text-white hover:text-[#7CB92C] ${
          isActive ? 'text-[#7CB92C] font-semibold' : ''
        }`
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="shadow-md bg-black text-white sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Brand: dove icon linking to the start page (Formate) */}
        <Link to="/formats" className="flex items-center space-x-2 text-white">
          <img src={pigeonWhite} alt="MoaFinder Logo" className="h-6 w-auto" />
        </Link>
        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-2xl text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <FontAwesomeIcon icon={open ? faTimes : faBars} />
        </button>
        {/* Navigation links */}
        <nav
          className={`${open ? 'block' : 'hidden'} md:flex md:items-center w-full md:w-auto md:space-x-6`}
        >
          <NavItem to="/">Orte</NavItem>
          <NavItem to="/entries">Einträge</NavItem>
          <NavItem to="/formats">Formate</NavItem>
          <NavItem to="/contact">Kontakt</NavItem>
          <NavItem to="/login">Login</NavItem>
          <NavItem to="/register">Registrieren</NavItem>
        </nav>
        {/* Search icon on desktop */}
        <button
          className="hidden md:block ml-4"
          onClick={onSearchOpen}
          aria-label="Suche öffnen"
        >
          <img src={searchIcon} alt="Suche" className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;