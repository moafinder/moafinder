import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Search overlay component. Displays a full‑screen dark overlay with
 * a search input and list of results. Clicking outside or pressing
 * Enter/Space will close the overlay. Results are mocked for
 * demonstration; replace with real search logic.
 *
 * Accessibility: the outer div has role="button" and is
 * keyboard‑accessible. The inner content stops propagation of
 * events so clicks inside do not close the overlay. We avoid
 * autoFocus on the input to prevent usability issues.
 */
const SearchOverlay = ({ isVisible, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Reset search state when overlay visibility changes
  useEffect(() => {
    if (!isVisible) {
      setQuery('');
      setResults([]);
    }
  }, [isVisible]);

  // Perform simple search on local data. In production you would
  // query your API here. The list contains entries and places for
  // demonstration.
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const places = [
      { id: 1, name: 'Teehaus Moabit' },
      { id: 2, name: 'Öffentliche Bibliothek' },
      { id: 3, name: 'Markthalle Moabit' },
    ];
    const entries = [
      { id: 1, title: 'Moabit im Wandel – Neue Projekte 2025' },
      { id: 2, title: 'Konzert im Park – Musik unter freiem Himmel' },
      { id: 3, title: 'Geschichte Moabits – Eine Reise durch die Zeit' },
    ];
    const foundPlaces = places
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({ type: 'place', id: p.id, label: p.name }));
    const foundEntries = entries
      .filter((e) => e.title.toLowerCase().includes(q))
      .map((e) => ({ type: 'entry', id: e.id, label: e.title }));
    setResults([...foundPlaces, ...foundEntries]);
  }, [query]);

  if (!isVisible) return null;

  // Close overlay on Enter/Space keys
  const handleOverlayKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };

  return (
    <div
      className="search-overlay"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        className="search-box"
        role="presentation"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          className="search-input"
          placeholder="Suchbegriff eingeben"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 ? (
          <div className="search-results">
            <ul className="space-y-2">
              {results.map((item) => (
                <li key={`${item.type}-${item.id}`} className="text-gray-700 hover:text-primary-700">
                  {item.type === 'place' ? (
                    <Link to={`/place/${item.id}`} onClick={onClose}>
                      {item.label}
                    </Link>
                  ) : (
                    <Link to={`/entries/${item.id}`} onClick={onClose}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          query && (
            <p className="text-gray-600 mt-2">
              »Zu Ihrem Suchbegriff ›{query}‹ haben wir keine Ergebnisse auf unseren Seiten gefunden. Bitte versuchen Sie es mit einem anderen Begriff.«
            </p>
          )
        )}
        <button onClick={onClose} className="btn mt-4">
          Schließen
        </button>
      </div>
    </div>
  );
};

export default SearchOverlay;