import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FilterSystem from '../components/FilterSystem';
// Remove the old FilterBar import
// import FilterBar from '../components/FilterBar';

/**
 * Updated Formats page with new FilterSystem component
 * Replaces the old FilterBar with the new advanced filtering
 */
const FormatsPage = () => {
  // Sample events data - replace with your API data
  const [allEvents, setAllEvents] = useState([
    {
      id: 1,
      date: '2025-05-07',
      time: '16:00–23:30 Uhr',
      place: 'Refo Moabit',
      category: 'Begegnung & Party',
      themes: ['Begegnung & Party', 'Essen & Trinken'],
      type: 'einmalig',
      targetAudience: ['Jugendliche', 'Erwachsene'],
      title: 'Friedensfest statt kriegstüchtig | Demo auf der Beusselstraße',
      excerpt: 'Friedensfest statt kriegstüchtig | Demo auf der Beusselstraße...',
      free: true,
      inclusion: false,
      weekday: 'mi'
    },
    {
      id: 2,
      date: '2025-06-14',
      time: '11:00–22:00 Uhr',
      place: 'Schulgarten',
      category: 'Kultur & Sprache',
      themes: ['Kultur & Sprache', 'Begegnung & Party'],
      type: 'einmalig',
      targetAudience: ['Kinder', 'Jugendliche', 'Erwachsene'],
      title: 'Sommerfest für Groß und Klein',
      excerpt: 'Zwischen blühenden Blumen und unter Blätterdächern...',
      free: true,
      inclusion: true,
      weekday: 'sa'
    },
    {
      id: 3,
      date: '2025-07-24',
      time: '23:00 Uhr',
      place: 'ZK/U',
      category: 'Musik & Gesang',
      themes: ['Musik & Gesang', 'Begegnung & Party'],
      type: 'regelmaessig',
      targetAudience: ['Erwachsene'],
      title: 'Lorem ipsum dolor sit amet',
      excerpt: 'Donec quam felis, ultricies nec, pellentesque eu...',
      free: false,
      inclusion: false,
      weekday: 'do'
    }
  ]);

  const [filteredEvents, setFilteredEvents] = useState(allEvents);
  const [activeFilters, setActiveFilters] = useState(null);

  // Handle filter changes from FilterSystem component
  const handleFiltersChange = (filters) => {
    setActiveFilters(filters);
    
    let filtered = [...allEvents];

    // Filter by target audience
    if (filters.targetAudience) {
      const audiences = [];
      if (filters.targetAudience.kinder) audiences.push('Kinder');
      if (filters.targetAudience.jugendliche) audiences.push('Jugendliche');
      if (filters.targetAudience.erwachsene) audiences.push('Erwachsene');
      
      if (audiences.length > 0) {
        filtered = filtered.filter(event => 
          event.targetAudience.some(audience => audiences.includes(audience))
        );
      }
    }

    // Filter by inclusion
    if (filters.inclusion) {
      filtered = filtered.filter(event => event.inclusion === true);
    }

    // Filter by free events
    if (filters.free) {
      filtered = filtered.filter(event => event.free === true);
    }

    // Filter by event type
    if (filters.eventType && filters.eventType !== 'both') {
      filtered = filtered.filter(event => event.type === filters.eventType);
    }

    // Filter by themes
    if (filters.themes && filters.themes.length > 0) {
      filtered = filtered.filter(event => 
        event.themes.some(theme => filters.themes.includes(theme))
      );
    }

    // Filter by locations
    if (filters.locations && filters.locations.length > 0) {
      filtered = filtered.filter(event => 
        filters.locations.includes(event.place)
      );
    }

    // Filter by dates
    if (filters.dates && filters.dates.length > 0) {
      filtered = filtered.filter(event => 
        filters.dates.includes(event.date)
      );
    }

    // Filter by weekdays
    if (filters.weekdays && filters.weekdays.length > 0) {
      filtered = filtered.filter(event => 
        filters.weekdays.includes(event.weekday)
      );
    }

    setFilteredEvents(filtered);
  };

  // Load events from API on component mount
  useEffect(() => {
    // TODO: Replace with actual API call
    // fetchEvents().then(events => setAllEvents(events));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Formate</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filter System */}
          <div className="lg:w-1/3 xl:w-1/4">
            <FilterSystem onFiltersChange={handleFiltersChange} />
          </div>

          {/* Main Content - Events List */}
          <div className="lg:w-2/3 xl:w-3/4">
            {/* Results Header */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {filteredEvents.length} Veranstaltungen gefunden
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
                  Neueste
                </button>
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
                  Heute
                </button>
              </div>
            </div>

            {/* Events Grid */}
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/event/${event.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold mb-1 hover:text-[#7CB92C] transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold">{event.place}</span>
                            <span>•</span>
                            <span>{event.date}</span>
                            <span>•</span>
                            <span>{event.time}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.free && (
                            <span className="inline-block px-3 py-1 bg-[#7CB92C] text-white text-xs rounded-full">
                              umsonst
                            </span>
                          )}
                          {event.inclusion && (
                            <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                              Inklusion
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{event.excerpt}</p>
                      <div className="flex flex-wrap gap-2">
                        {event.themes.map((theme, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">Keine Veranstaltungen gefunden</h3>
                  <p className="text-gray-600">
                    Versuchen Sie, Ihre Filterkriterien anzupassen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatsPage;