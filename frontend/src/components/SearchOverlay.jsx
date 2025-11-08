import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EVENTS, PLACES } from '../data/mockData';

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

  // Perform simple search on local mock data (events + places).
  // In production, replace this with a backend query.
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();

    const foundPlaces = PLACES.filter((p) => {
      const name = `${p.name ?? ''} ${p.shortName ?? ''}`.toLowerCase();
      const cats = Array.isArray(p.categories) ? p.categories.join(' ').toLowerCase() : '';
      return name.includes(q) || cats.includes(q);
    }).map((p) => ({ type: 'place', id: p.id, label: p.name }));

    const foundEvents = EVENTS.filter((e) => {
      const hay = `${e.title ?? ''} ${e.place ?? ''} ${e.category ?? ''}`.toLowerCase();
      return hay.includes(q);
    }).map((e) => ({ type: 'event', id: e.id, label: e.title }));

    setResults([...foundEvents, ...foundPlaces]);
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
                <li key={`${item.type}-${item.id}`} className="text-gray-700 hover:text-brand">
                  {item.type === 'place' ? (
                    <Link to={`/place/${item.id}`} onClick={onClose}>
                      {item.label}
                    </Link>
                  ) : (
                    <Link to={`/event/${item.id}`} onClick={onClose}>
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
