import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EVENTS } from '../data/mockData';

// Filter System Component
const FilterSystem = ({ onFiltersChange }) => {
  const [targetAudience, setTargetAudience] = useState({
    kinder: true,
    jugendliche: true,
    erwachsene: true,
  });
  const [inclusion, setInclusion] = useState(false);
  const [free, setFree] = useState(false);
  const [eventType, setEventType] = useState('both');
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const themes = [
    'Sport & Action',
    'Essen & Trinken',
    'Baby & Familie',
    'Kunst & Kreativität',
    'Musik & Gesang',
    'Begegnung & Party',
    'Tanz & Darstellung',
    'Kultur & Sprache',
    'Antirassismus & Empowerment',
    'Bildung',
    'Bunt & Queer',
    'Vielfalt & Akzeptanz',
  ];

  const locations = [
    'Stephans',
    'Schulgarten',
    'Stadtschloss',
    'ZKU',
    'Rathaus',
    'Nachbarschaft',
    'Refo Moabit',
    'Ottopark',
  ];

  const applyFilters = () => {
    const filters = {
      targetAudience,
      inclusion,
      free,
      eventType,
      themes: selectedThemes,
      locations: selectedLocations,
      dates: selectedDates,
    };
    onFiltersChange(filters);
  };

  const clearAllFilters = () => {
    setTargetAudience({ kinder: true, jugendliche: true, erwachsene: true });
    setInclusion(false);
    setFree(false);
    setEventType('both');
    setSelectedThemes([]);
    setSelectedLocations([]);
    setSelectedDates([]);
    onFiltersChange({
      targetAudience: { kinder: true, jugendliche: true, erwachsene: true },
      inclusion: false,
      free: false,
      eventType: 'both',
      themes: [],
      locations: [],
      dates: [],
    });
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [targetAudience, inclusion, free, eventType, selectedThemes, selectedLocations, selectedDates]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Filter</h2>
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-600 hover:text-green-600 transition-colors"
        >
          Alle Filter zurücksetzen
        </button>
      </div>

      {/* Target Audience */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Angebote für...</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTargetAudience({...targetAudience, kinder: !targetAudience.kinder})}
            className={`px-4 py-2 rounded-md transition-all border-2 ${
              targetAudience.kinder 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            Kinder
          </button>
          <button
            onClick={() => setTargetAudience({...targetAudience, jugendliche: !targetAudience.jugendliche})}
            className={`px-4 py-2 rounded-md transition-all border-2 ${
              targetAudience.jugendliche 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            Jugendliche
          </button>
          <button
            onClick={() => setTargetAudience({...targetAudience, erwachsene: !targetAudience.erwachsene})}
            className={`px-4 py-2 rounded-md transition-all border-2 ${
              targetAudience.erwachsene 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            Erwachsene
          </button>
        </div>
      </div>

      {/* Inclusion and Free Options */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={() => setInclusion(!inclusion)}
            className={`px-4 py-2 rounded-md transition-all border-2 ${
              inclusion 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            inklusive
          </button>
          <button
            onClick={() => setFree(!free)}
            className={`px-4 py-2 rounded-md transition-all border-2 ${
              free 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            umsonst
          </button>
        </div>
      </div>

      {/* Event Type Slider */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Veranstaltungstyp</h3>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${eventType === 'einmalig' ? 'font-bold text-green-600' : 'text-gray-600'}`}>
            einmalig
          </span>
          <div className="relative w-48 h-8">
            <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
            <input
              type="range"
              min="0"
              max="2"
              value={eventType === 'einmalig' ? 0 : eventType === 'both' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setEventType(val === 0 ? 'einmalig' : val === 1 ? 'both' : 'regelmaessig');
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full shadow-md transition-all duration-300"
              style={{
                left: eventType === 'einmalig' ? '0%' : eventType === 'both' ? 'calc(50% - 12px)' : 'calc(100% - 24px)'
              }}
            ></div>
          </div>
          <span className={`text-sm ${eventType === 'regelmaessig' ? 'font-bold text-green-600' : 'text-gray-600'}`}>
            regelmäßig
          </span>
        </div>
      </div>

      {/* Themes Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setShowThemeDropdown(!showThemeDropdown)}
          className="w-full px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-md hover:border-black transition-colors flex justify-between items-center"
        >
          <span className="font-medium">
            Themen {selectedThemes.length > 0 && <span className="text-green-600">({selectedThemes.length})</span>}
          </span>
          <svg className={`h-5 w-5 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showThemeDropdown && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {themes.map(theme => (
              <label key={theme} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedThemes.includes(theme)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedThemes([...selectedThemes, theme]);
                    } else {
                      setSelectedThemes(selectedThemes.filter(t => t !== theme));
                    }
                  }}
                  className="mr-2"
                />
                <span>{theme}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Locations Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="w-full px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-md hover:border-black transition-colors flex justify-between items-center"
        >
          <span className="font-medium">
            Orte {selectedLocations.length > 0 && <span className="text-green-600">({selectedLocations.length})</span>}
          </span>
          <svg className={`h-5 w-5 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showLocationDropdown && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {locations.map(location => (
              <label key={location} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocations([...selectedLocations, location]);
                    } else {
                      setSelectedLocations(selectedLocations.filter(l => l !== location));
                    }
                  }}
                  className="mr-2"
                />
                <span>{location}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={applyFilters}
        className="w-full bg-black text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-all transform hover:scale-[1.02]"
      >
        Filter anwenden
      </button>
    </div>
  );
};

// Main EventsPage Component
const EventsPage = () => {
  // Enhanced mock data with filter properties
  const enhancedEvents = EVENTS.map(event => ({
    ...event,
    // Parse categories to determine target audience
    targetAudience: (() => {
      const audiences = [];
      const cat = event.category?.toLowerCase() || '';
      if (cat.includes('kinder') || cat.includes('family')) audiences.push('kinder');
      if (cat.includes('jugend')) audiences.push('jugendliche');
      audiences.push('erwachsene'); // Default all events available for adults
      return audiences;
    })(),
    // Parse themes from category
    themes: event.category?.split(',').map(c => c.trim()) || [],
    // Location is placeShort
    location: event.placeShort,
    // Random properties for demo
    free: Math.random() > 0.5,
    inclusion: Math.random() > 0.7,
    eventType: event.type?.includes('regelmäßig') ? 'regelmaessig' : 'einmalig',
  }));

  const [filters, setFilters] = useState({
    targetAudience: { kinder: true, jugendliche: true, erwachsene: true },
    inclusion: false,
    free: false,
    eventType: 'both',
    themes: [],
    locations: [],
    dates: [],
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events based on current filters and search
  const filteredEvents = enhancedEvents.filter(event => {
    // Check target audience
    const audienceMatch = Object.entries(filters.targetAudience)
      .filter(([_, enabled]) => enabled)
      .some(([audience, _]) => event.targetAudience.includes(audience));
    if (!audienceMatch) return false;

    // Check inclusion
    if (filters.inclusion && !event.inclusion) return false;

    // Check free
    if (filters.free && !event.free) return false;

    // Check event type
    if (filters.eventType !== 'both') {
      if (filters.eventType !== event.eventType) return false;
    }

    // Check themes
    if (filters.themes.length > 0) {
      const hasMatchingTheme = filters.themes.some(theme => 
        event.themes.some(eventTheme => eventTheme.includes(theme))
      );
      if (!hasMatchingTheme) return false;
    }

    // Check locations
    if (filters.locations.length > 0) {
      if (!filters.locations.includes(event.location)) return false;
    }

    // Check dates
    if (filters.dates.length > 0) {
      if (!filters.dates.includes(event.date)) return false;
    }

    // Check search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        event.title?.toLowerCase().includes(query) ||
        event.place?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query) ||
        event.excerpt?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sections
  const newestEvents = filteredEvents.slice(0, 4);
  const todayEvents = filteredEvents.filter(e => e.date === new Date().toISOString().split('T')[0]);
  
  const renderEventCard = (event) => (
    <Link to={`/event/${event.id}`} key={event.id} className="block">
      <div className="flex border-b py-4 hover:bg-gray-50 transition-colors">
        <div className={`w-1/5 h-24 md:h-28 flex-shrink-0 ${event.color}`}>
          {event.image && (
            <img src={event.image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="w-4/5 pl-4">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">
              {new Date(event.date).toLocaleDateString('de-DE', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
              {event.time && ` / ${event.time}`}
            </p>
            {event.free && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">kostenlos</span>
            )}
            {event.inclusion && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">inklusiv</span>
            )}
          </div>
          <h3 className="font-bold text-gray-800 mt-1 mb-1">{event.placeShort}</h3>
          <p className="text-sm font-semibold text-gray-800 mb-1">{event.title}</p>
          <p className="text-sm text-gray-600">{event.excerpt}</p>
          <p className="text-xs text-gray-500 mt-1">{event.category}</p>
        </div>
      </div>
    </Link>
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">MoaFinder Events</h1>
        <p className="text-xl text-gray-600">Entdecke Veranstaltungen in Moabit</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Suche nach Veranstaltungen, Orten oder Themen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="lg:w-1/3">
          <FilterSystem onFiltersChange={setFilters} />
        </div>

        {/* Events List */}
        <div className="lg:w-2/3">
          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            {filteredEvents.length} Veranstaltungen gefunden
          </div>

          {/* NEUESTE section */}
          {newestEvents.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-green-600 mr-2">▶</span> NEUESTE
              </h2>
              <div className="space-y-2">
                {newestEvents.map(renderEventCard)}
              </div>
            </section>
          )}
          
          {/* HEUTE section */}
          {todayEvents.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-green-600 mr-2">▶</span> HEUTE
              </h2>
              <div className="space-y-2">
                {todayEvents.map(renderEventCard)}
              </div>
            </section>
          )}

          {/* All Events */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="text-green-600 mr-2">▶</span> ALLE VERANSTALTUNGEN
            </h2>
            <div className="space-y-2">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(renderEventCard)
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Keine Veranstaltungen gefunden. Versuche es mit anderen Filtereinstellungen.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;