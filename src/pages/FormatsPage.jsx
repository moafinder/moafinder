import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import headerGraphic from '../assets/header_grafik_klein.png';
import { EVENTS } from '../data/mockData';

const FormatsPage = () => {
  const [filteredEvents, setFilteredEvents] = useState(EVENTS);
  
  // Sections for NEUESTE and HEUTE
  const newestEvents = EVENTS.slice(0, 4);
  const todayEvents = EVENTS.filter(e => e.date === '2025-04-24');
  
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
      <FilterBar onFilterChange={setFilteredEvents} />
      
      {/* NEUESTE section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="text-green-600 mr-2">▶</span> NEUESTE
        </h2>
        <div className="space-y-2">
          {newestEvents.map(renderEventCard)}
        </div>
      </section>
      
      {/* HEUTE section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="text-green-600 mr-2">▶</span> HEUTE
        </h2>
        <div className="space-y-2">
          {todayEvents.length > 0 ? (
            todayEvents.map(renderEventCard)
          ) : (
            <p className="text-gray-600">Keine Veranstaltungen für heute.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default FormatsPage;