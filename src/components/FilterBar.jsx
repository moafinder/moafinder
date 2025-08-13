import React, { useState, useEffect } from 'react';

const FilterBar = ({ onFilterChange }) => {
  const [ageGroups, setAgeGroups] = useState(['Kinder', 'Jugendliche', 'Erwachsene']);
  const [inclusion, setInclusion] = useState(false);
  const [free, setFree] = useState(false);
  const [eventType, setEventType] = useState('all'); // 'all', 'einmalig', 'regelmäßig'
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  
  const themes = [
    'Baby und Familie',
    'Geschlechtsspezifische Unterstützung',
    'Geschlechtliche & sexuelle Vielfalt',
    'Flucht & Migration',
    'Antirassismus & Empowerment',
    'Kunst & Kreativität',
    'Musik & Gesang',
    'Tanz & Darstellung',
    'Begegnung & Party',
    'Kultur & Sprache',
  ];
  
  const places = [
    'Arminiusmarkthalle',
    'B-Laden',
    'CJD',
    'ClSpace',
    'Im Kiez',
    'Jugendhaus B8',
    'Schlupfwinkel',
    'Bibliothek',
    'Die Brücke',
    'Mobil im Kiez',
    'Offenes Wohnzimmer',
    'Otto-Spielplatz',
    'Refo Moabit',
    'Stadtschloss Moabit',
  ];
  
  const toggleAgeGroup = (group) => {
    setAgeGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  useEffect(() => {
    onFilterChange({
      ageGroups,
      inclusion,
      free,
      eventType,
      themes: selectedThemes,
      places: selectedPlaces,
      dates: selectedDates,
    });
  }, [ageGroups, inclusion, free, eventType, selectedThemes, selectedPlaces, selectedDates, onFilterChange]);
  
  return (
    <div className="bg-white p-6">
      {/* Age groups and options row */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold mr-2">Angebote für...</span>

            {['Kinder', 'Jugendliche', 'Erwachsene'].map(group => (
              <button
                key={group}
                type="button"
                onClick={() => toggleAgeGroup(group)}
                className={`px-4 py-2 rounded-full border-2 text-sm transition-colors ${
                  ageGroups.includes(group)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {group}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setInclusion(!inclusion)}
              className={`relative px-4 py-2 rounded-full border-2 text-sm transition-colors group ${
                inclusion
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              Inklusion*
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded w-48">
                Barrierefreie Angebote und Veranstaltungen
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFree(!free)}
              className={`px-4 py-2 rounded-full border-2 text-sm transition-colors ${
                free
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              umsonst
            </button>
          </div>
        </div>

      {/* Event type toggle */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm whitespace-nowrap">regelmäßige Angebote</span>
          <div className="flex-1 bg-black px-2 py-1">
            <input
              type="range"
              min="0"
              max="2"
              value={eventType === 'regelmäßig' ? 0 : eventType === 'all' ? 1 : 2}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setEventType(val === 0 ? 'regelmäßig' : val === 1 ? 'all' : 'einmalig');
              }}
              className="filter-range w-full"
            />
          </div>
          <span className="font-semibold text-sm whitespace-nowrap">einmalige Veranstaltungen</span>
        </div>
      </div>

      {/* Dropdowns row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Themes dropdown */}
          <div className="relative">
            <select
              className="w-full p-2 border-2 border-black rounded-none appearance-none focus:outline-none"
              onChange={(e) => {
                if (e.target.value && !selectedThemes.includes(e.target.value)) {
                  setSelectedThemes([...selectedThemes, e.target.value]);
                }
              }}
            >
              <option value="">Themen</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-2 h-2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0l5 6 5-6H0z" />
              </svg>
            </span>
            {selectedThemes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedThemes.map(theme => (
                  <span key={theme} className="bg-green-100 px-2 py-1 rounded text-xs">
                    {theme}
                    <button
                      type="button"
                      onClick={() => setSelectedThemes(selectedThemes.filter(t => t !== theme))}
                      className="ml-1 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Places dropdown */}
          <div className="relative">
            <select
              className="w-full p-2 border-2 border-black rounded-none appearance-none focus:outline-none"
              onChange={(e) => {
                if (e.target.value && !selectedPlaces.includes(e.target.value)) {
                  setSelectedPlaces([...selectedPlaces, e.target.value]);
                }
              }}
            >
              <option value="">Orte</option>
              {places.map(place => (
                <option key={place} value={place}>{place}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-2 h-2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0l5 6 5-6H0z" />
              </svg>
            </span>
            {selectedPlaces.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedPlaces.map(place => (
                  <span key={place} className="bg-green-100 px-2 py-1 rounded text-xs">
                    {place}
                    <button
                      type="button"
                      onClick={() => setSelectedPlaces(selectedPlaces.filter(p => p !== place))}
                      className="ml-1 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date selector */}
          <div className="relative">
            <input
              type="text"
              placeholder="Termine"
              className="w-full p-2 border-2 border-black rounded-none appearance-none focus:outline-none"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              onChange={(e) => {
                if (e.target.value && !selectedDates.includes(e.target.value)) {
                  setSelectedDates([...selectedDates, e.target.value]);
                }
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-2 h-2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0l5 6 5-6H0z" />
              </svg>
            </span>
            {selectedDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedDates.map(date => (
                  <span key={date} className="bg-green-100 px-2 py-1 rounded text-xs">
                    {new Date(date).toLocaleDateString('de-DE')}
                    <button
                      type="button"
                      onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))}
                      className="ml-1 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default FilterBar;
