import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../api/events';
import { listLocations } from '../api/locations';
import { adaptEvent, adaptLocation } from '../utils/dataAdapters';

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

  // Load searchable data when overlay opens
  const [eventCache, setEventCache] = useState([]);
  const [placeCache, setPlaceCache] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!isVisible) return;
      setLoading(true);
      try {
        const [eventsRes, placesRes] = await Promise.all([
          listEvents({ limit: 200, depth: 2, sort: 'startDate', 'where[status][equals]': 'approved' }).catch(() => null),
          listLocations({ limit: 200 }).catch(() => null),
        ]);
        if (!cancelled) {
          const events = Array.isArray(eventsRes?.docs) ? eventsRes.docs.map(adaptEvent).filter(Boolean) : [];
          const places = Array.isArray(placesRes?.docs) ? placesRes.docs.map(adaptLocation).filter(Boolean) : [];
          setEventCache(events);
          setPlaceCache(places);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [isVisible]);

  // Filter cached results on the client for fast suggestions
  useEffect(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const evs = eventCache
      .filter((e) => {
        const hay = `${e.title ?? ''} ${e.organizer?.name ?? ''} ${e.location?.name ?? ''} ${
          (e.topicTags || []).join(' ')
        }`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8)
      .map((e) => ({ type: 'event', id: e.id, label: e.title }));

    const pls = placeCache
      .filter((p) => {
        const hay = `${p.name ?? ''} ${p.shortName ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 5)
      .map((p) => ({ type: 'place', id: p.id, label: p.name }));

    setResults([...evs, ...pls]);
  }, [query, eventCache, placeCache]);

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
          query && !loading && (
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
