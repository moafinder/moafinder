import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import headerGraphic from '../assets/header_grafik_klein.png';
import { EVENTS } from '../data/mockData';

const FormatsPage = () => {
  const [filteredEvents, setFilteredEvents] = useState(EVENTS);

  // Apply filtering logic based on selected filters
  const handleFilterChange = useCallback((filters) => {
    let results = EVENTS;

    // AND logic for checkboxes (age groups, inclusion, free)
    if (filters.ageGroups && filters.ageGroups.length && filters.ageGroups.length !== 3) {
      results = results.filter(
        (event) =>
          event.ageGroups && filters.ageGroups.some((g) => event.ageGroups.includes(g))
      );
    }

    if (filters.inclusion) {
      results = results.filter((event) => event.inclusion);
    }

    if (filters.free) {
      results = results.filter((event) => event.free);
    }

    if (filters.eventType && filters.eventType !== 'all') {
      const typeMap = {
        einmalig: 'einmalige Veranstaltung',
        regelmäßig: 'regelmäßiges Angebot',
      };
      results = results.filter((event) => event.type === typeMap[filters.eventType]);
    }

    // OR logic for dropdown selections
    if (filters.themes && filters.themes.length) {
      results = results.filter((event) => {
        const categories = event.category
          ? event.category.split(',').map((c) => c.trim())
          : [];
        return filters.themes.some((theme) => categories.includes(theme));
      });
    }

    if (filters.places && filters.places.length) {
      results = results.filter(
        (event) =>
          filters.places.includes(event.place) ||
          filters.places.includes(event.placeShort)
      );
    }

    if (filters.dates && filters.dates.length) {
      results = results.filter((event) => filters.dates.includes(event.date));
    }

    setFilteredEvents(results);
  }, []);
  
  const renderEventCard = (event) => (
    <Link to={`/event/${event.id}`} key={event.id} className="block">
      <div className="flex border-b py-4 hover:bg-gray-50 transition-colors">
        <div className={`w-1/5 h-24 md:h-28 flex-shrink-0 ${event.color}`}>
          {event.image && (
            <img src={event.image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="w-4/5 pl-4">
          <p className="text-sm text-gray-600">
            {new Date(event.date).toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
            {event.time && ` / ${event.time}`}
            &nbsp;&nbsp;
            <span className="font-semibold text-gray-800">{event.category}</span>
            &nbsp;
            <span className="text-xs text-gray-500">{event.type}</span>
          </p>
          <h3 className="font-bold text-gray-800 mt-1 mb-1">{event.placeShort}</h3>
          <p className="text-sm font-semibold text-gray-800 mb-1">{event.title}</p>
          <p className="text-sm text-gray-600">{event.excerpt}</p>
        </div>
      </div>
    </Link>
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero banner */}
      <div className="mb-6 text-center">
        <img
          src={headerGraphic}
          alt="MoaFinder Banner"
          className="mx-auto w-auto h-32 md:h-40 object-contain"
        />
        <p className="text-xl md:text-2xl font-semibold mt-2">
          Meine Mitte ist Moabit
        </p>
      </div>
      
      {/* Filter bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Filtered results */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="text-green-600 mr-2">▶</span> SUCHERGEBNISSE
        </h2>
        <div className="space-y-2">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(renderEventCard)
          ) : (
            <p className="text-gray-600">Keine Veranstaltungen gefunden.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default FormatsPage;