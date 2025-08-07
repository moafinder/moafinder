import React, { useState } from 'react';

/**
 * Advanced Filter System Component for MoaFinder
 * Implements the multi-functional filter system as per requirements:
 * - Target audience selection (Kinder, Jugendliche, Erwachsene)
 * - Inclusion and free options with tooltip
 * - One-time vs. regular events slider
 * - Theme and location dropdowns
 * - Date picker with multiple selection support
 */
const FilterSystem = ({ onFiltersChange }) => {
  // Filter states
  const [targetAudience, setTargetAudience] = useState({
    kinder: true,
    jugendliche: true,
    erwachsene: true,
  });
  const [inclusion, setInclusion] = useState(false);
  const [free, setFree] = useState(false);
  const [eventType, setEventType] = useState('both'); // 'einmalig', 'regelmaessig', 'both'
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [showInclusionTooltip, setShowInclusionTooltip] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Theme categories from requirements
  const themes = [
    'Sport & Action',
    'Essen & Trinken',
    'Baby & Familie',
    'Natur & Tiere',
    'Spielen & Probieren',
    'Kunst & Kreativität',
    'Musik & Gesang',
    'Begegnung & Party',
    'Tanz & Darstellung',
    'Theater & Kino',
    'Ausstellungen & Medien',
    'Kultur & Sprache',
    'Religion & Spiritualität',
    'Politik & Einsatz',
    'Vielfalt & Akzeptanz',
    'Bunt & Queer',
    'FLINTA & Community',
    'Frauen & Stärke',
    'Flucht & Migration',
    'Antirassismus & Empowerment',
    'Beratung & Bildung',
    'Netzwerk & Selbsthilfe'
  ];

  // Sample locations - replace with actual data from your backend
  const locations = [
    'Refo Moabit',
    'Stadtschloss Moabit',
    'Kulturfabrik',
    'Zille-Haus',
    'Schulgarten',
    'ZK/U',
    'Moabiter Ratschlag',
    'Ottopark',
    'Fritz-Schloß-Park',
    'Arminius-Markthalle',
    'Reformationskirche',
    'Heilandskirche',
    'Stadtbibliothek',
    'Jugendclub',
    'Nachbarschaftshaus'
  ];

  const weekdays = [
    { id: 'mo', name: 'Montag', short: 'Mo' },
    { id: 'di', name: 'Dienstag', short: 'Di' },
    { id: 'mi', name: 'Mittwoch', short: 'Mi' },
    { id: 'do', name: 'Donnerstag', short: 'Do' },
    { id: 'fr', name: 'Freitag', short: 'Fr' },
    { id: 'sa', name: 'Samstag', short: 'Sa' },
    { id: 'so', name: 'Sonntag', short: 'So' }
  ];

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const days = [];

    // Add empty cells for days before month starts
    const startingDayOfWeek = firstDay.getDay();
    const daysToAdd = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    for (let i = 0; i < daysToAdd; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    
    return days;
  };

  const handleThemeToggle = (theme) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const handleLocationToggle = (location) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleDateToggle = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleWeekdayToggle = (weekday) => {
    setSelectedWeekdays(prev => 
      prev.includes(weekday) 
        ? prev.filter(w => w !== weekday)
        : [...prev, weekday]
    );
  };

  const applyFilters = () => {
    const filters = {
      targetAudience,
      inclusion,
      free,
      eventType,
      themes: selectedThemes,
      locations: selectedLocations,
      dates: selectedDates,
      weekdays: selectedWeekdays
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
    setSelectedWeekdays([]);
    // Apply cleared filters
    onFiltersChange({
      targetAudience: { kinder: true, jugendliche: true, erwachsene: true },
      inclusion: false,
      free: false,
      eventType: 'both',
      themes: [],
      locations: [],
      dates: [],
      weekdays: []
    });
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Filter Header with Clear Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Filter</h2>
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-600 hover:text-[#7CB92C] transition-colors duration-300"
        >
          Alle Filter zurücksetzen
        </button>
      </div>

      {/* Target Audience Section */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Angebote für...</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTargetAudience({...targetAudience, kinder: !targetAudience.kinder})}
            className={`px-4 py-2 rounded-md transition-all duration-300 border-2 ${
              targetAudience.kinder 
                ? 'bg-[#7CB92C] text-white border-[#7CB92C]' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:shadow-md'
            }`}
          >
            Kinder
          </button>
          <button
            onClick={() => setTargetAudience({...targetAudience, jugendliche: !targetAudience.jugendliche})}
            className={`px-4 py-2 rounded-md transition-all duration-300 border-2 ${
              targetAudience.jugendliche 
                ? 'bg-[#7CB92C] text-white border-[#7CB92C]' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:shadow-md'
            }`}
          >
            Jugendliche
          </button>
          <button
            onClick={() => setTargetAudience({...targetAudience, erwachsene: !targetAudience.erwachsene})}
            className={`px-4 py-2 rounded-md transition-all duration-300 border-2 ${
              targetAudience.erwachsene 
                ? 'bg-[#7CB92C] text-white border-[#7CB92C]' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:shadow-md'
            }`}
          >
            Erwachsene
          </button>
          
          {/* Inclusion with tooltip */}
          <div className="relative">
            <button
              onClick={() => setInclusion(!inclusion)}
              onMouseEnter={() => setShowInclusionTooltip(true)}
              onMouseLeave={() => setShowInclusionTooltip(false)}
              className={`px-4 py-2 rounded-md transition-all duration-300 border-2 ${
                inclusion 
                  ? 'bg-[#7CB92C] text-white border-[#7CB92C]' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:shadow-md'
              }`}
            >
              Inklusion*
            </button>
            {showInclusionTooltip && (
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-md whitespace-nowrap">
                Barrierefreie Angebote für alle Menschen
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="border-8 border-transparent border-t-black"></div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setFree(!free)}
            className={`px-4 py-2 rounded-md transition-all duration-300 border-2 ${
              free 
                ? 'bg-[#7CB92C] text-white border-[#7CB92C]' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:shadow-md'
            }`}
          >
            umsonst
          </button>
        </div>
      </div>

      {/* Event Type Slider */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">einmalige Angebote vs. regelmäßige Veranstaltungen</h3>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${eventType === 'einmalig' ? 'font-bold text-[#7CB92C]' : 'text-gray-600'}`}>
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
              className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#7CB92C] rounded-full shadow-md transition-all duration-300"
              style={{
                left: eventType === 'einmalig' ? '0%' : eventType === 'both' ? 'calc(50% - 12px)' : 'calc(100% - 24px)'
              }}
            ></div>
          </div>
          <span className={`text-sm ${eventType === 'regelmaessig' ? 'font-bold text-[#7CB92C]' : 'text-gray-600'}`}>
            regelmäßig
          </span>
        </div>
      </div>

      {/* Themes Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setShowThemeDropdown(!showThemeDropdown)}
          className="w-full px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-md hover:border-black transition-colors duration-300 flex justify-between items-center"
        >
          <span className="font-medium">
            Themen {selectedThemes.length > 0 && <span className="text-[#7CB92C]">({selectedThemes.length})</span>}
          </span>
          <svg className={`h-5 w-5 transition-transform duration-300 ${showThemeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showThemeDropdown && (
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {themes.map(theme => (
              <label key={theme} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedThemes.includes(theme)}
                  onChange={() => handleThemeToggle(theme)}
                  className="mr-3 w-4 h-4 text-[#7CB92C] focus:ring-[#7CB92C]"
                />
                <span className="text-sm">{theme}</span>
              </label>
            ))}
            <div className="sticky bottom-0 bg-white border-t p-2">
              <button
                onClick={() => setShowThemeDropdown(false)}
                className="w-full px-4 py-2 bg-[#7CB92C] text-white rounded-md hover:bg-[#5a8b20] transition-colors duration-300"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Locations Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="w-full px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-md hover:border-black transition-colors duration-300 flex justify-between items-center"
        >
          <span className="font-medium">
            Orte {selectedLocations.length > 0 && <span className="text-[#7CB92C]">({selectedLocations.length})</span>}
          </span>
          <svg className={`h-5 w-5 transition-transform duration-300 ${showLocationDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showLocationDropdown && (
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {locations.map(location => (
              <label key={location} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="mr-3 w-4 h-4 text-[#7CB92C] focus:ring-[#7CB92C]"
                />
                <span className="text-sm">{location}</span>
              </label>
            ))}
            <div className="sticky bottom-0 bg-white border-t p-2">
              <button
                onClick={() => setShowLocationDropdown(false)}
                className="w-full px-4 py-2 bg-[#7CB92C] text-white rounded-md hover:bg-[#5a8b20] transition-colors duration-300"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="w-full px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-md hover:border-black transition-colors duration-300 flex justify-between items-center"
        >
          <span className="font-medium">
            Termine {(selectedDates.length + selectedWeekdays.length) > 0 && 
              <span className="text-[#7CB92C]">({selectedDates.length + selectedWeekdays.length})</span>}
          </span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        
        {showDatePicker && (
          <div className="mt-2 p-4 bg-white border-2 border-gray-300 rounded-md shadow-lg">
            <p className="text-sm text-gray-600 mb-4">Mehrfachauswahl möglich - Einzelne Tage und Wochentage auswählbar</p>
            
            {/* Weekday Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Wochentage:</h4>
              <div className="grid grid-cols-7 gap-2">
                {weekdays.map(day => (
                  <button
                    key={day.id}
                    onClick={() => handleWeekdayToggle(day.id)}
                    className={`p-2 text-xs rounded transition-all duration-300 ${
                      selectedWeekdays.includes(day.id)
                        ? 'bg-[#7CB92C] text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Days */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Weekday headers */}
                {weekdays.map(day => (
                  <div key={day.id} className="text-xs font-semibold text-gray-600 p-1">
                    {day.short}
                  </div>
                ))}
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div key={index}>
                    {day ? (
                      <button
                        onClick={() => handleDateToggle(day)}
                        className={`w-full p-2 text-xs rounded transition-all duration-300 ${
                          selectedDates.includes(day.toISOString().split('T')[0])
                            ? 'bg-[#7CB92C] text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <div className="w-full p-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowDatePicker(false)}
              className="w-full mt-4 px-4 py-2 bg-[#7CB92C] text-white rounded-md hover:bg-[#5a8b20] transition-colors duration-300"
            >
              Termine übernehmen
            </button>
          </div>
        )}
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={applyFilters}
        className="w-full bg-black text-white font-bold py-3 px-4 rounded-md hover:bg-[#7CB92C] transition-all duration-300 transform hover:scale-[1.02]"
      >
        Filter anwenden
      </button>
    </div>
  );
};

export default FilterSystem;