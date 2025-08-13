import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import SearchOverlay from './SearchOverlay';
import pigeonWhite from '../assets/pigeon_white.png';

const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'text-green-400' : 'text-white hover:text-green-400';
  };
  
  return (
    <>
      <header className="bg-black text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={pigeonWhite} alt="MoaFinder" className="h-10 w-auto hover:opacity-80 transition-opacity" />
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/formate" className={`font-medium transition-colors ${isActive('/formate') || isActive('/')}`}>
                Formate
              </Link>
              <Link to="/orte" className={`font-medium transition-colors ${isActive('/orte')}`}>
                Orte
              </Link>
              <Link to="/kontakt" className={`font-medium transition-colors ${isActive('/kontakt')}`}>
                Kontakt
              </Link>
              <a href="https://moabit.world" target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-green-400 transition-colors">
                moabit.world
              </a>
              <a href="https://kiezmedium.de" target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-green-400 transition-colors">
                Kiezmedium
              </a>
            </nav>
            
            {/* Search and Login */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSearch(true)}
                className="text-white hover:text-green-400 transition-colors"
                aria-label="Suche öffnen"
              >
                <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
              </button>
              <Link to="/login" className="font-medium text-white hover:text-green-400 transition-colors">
                Login
              </Link>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap gap-4">
              <Link to="/formate" className={`font-medium transition-colors ${isActive('/formate') || isActive('/')}`}>
                Formate
              </Link>
              <Link to="/orte" className={`font-medium transition-colors ${isActive('/orte')}`}>
                Orte
              </Link>
              <Link to="/kontakt" className={`font-medium transition-colors ${isActive('/kontakt')}`}>
                Kontakt
              </Link>
              <a href="https://moabit.world" target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-green-400 transition-colors">
                moabit.world
              </a>
              <a href="https://kiezmedium.de" target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-green-400 transition-colors">
                Kiezmedium
              </a>
            </div>
          </nav>
        </div>
      </header>
      
      {/* Search Overlay */}
      {showSearch && <SearchOverlay isVisible={showSearch} onClose={() => setShowSearch(false)} />}
    </>
  );
};

export default Header;
