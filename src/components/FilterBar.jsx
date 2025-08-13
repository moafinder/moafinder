import React, { useState } from 'react';

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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Call the parent's filter change handler
    onFilterChange({
      ageGroups,
      inclusion,
      free,
      eventType,
      themes: selectedThemes,
      places: selectedPlaces,
      dates: selectedDates,
    });
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <form onSubmit={handleSubmit}>
        {/* Age groups and options row */}
        <div className="mb-4 pb-4 border-b border-gray-300">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold">Angebote für...</span>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ageGroups.includes('Kinder')}
                onChange={() => toggleAgeGroup('Kinder')}
                className="mr-2"
              />
              <span>Kinder</span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ageGroups.includes('Jugendliche')}
                onChange={() => toggleAgeGroup('Jugendliche')}
                className="mr-2"
              />
              <span>Jugendliche</span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ageGroups.includes('Erwachsene')}
                onChange={() => toggleAgeGroup('Erwachsene')}
                className="mr-2"
              />
              <span>Erwachsene</span>
            </label>
            
            <label className="flex items-center cursor-pointer group relative">
              <input
                type="checkbox"
                checked={inclusion}
                onChange={(e) => setInclusion(e.target.checked)}
                className="mr-2"
              />
              <span>Inklusion*</span>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded w-48">
                Barrierefreie Angebote und Veranstaltungen
              </div>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={free}
                onChange={(e) => setFree(e.target.checked)}
                className="mr-2"
              />
              <span>umsonst</span>
            </label>
          </div>
        </div>
        
        {/* Event type toggle */}
        <div className="mb-4 pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            <span className="font-semibold">regelmäßige Angebote</span>
            <div className="relative inline-block w-20 h-8">
              <input
                type="range"
                min="0"
                max="2"
                value={eventType === 'regelmäßig' ? 0 : eventType === 'all' ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEventType(val === 0 ? 'regelmäßig' : val === 1 ? 'all' : 'einmalig');
                }}
                className="slider w-full"
              />
            </div>
            <span className="font-semibold">einmalige Veranstaltungen</span>
          </div>
        </div>
        
        {/* Dropdowns row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Themes dropdown */}
          <div className="relative">
            <select 
              className="w-full p-2 border border-gray-300 rounded"
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
              className="w-full p-2 border border-gray-300 rounded"
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
              className="w-full p-2 border border-gray-300 rounded"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              onChange={(e) => {
                if (e.target.value && !selectedDates.includes(e.target.value)) {
                  setSelectedDates([...selectedDates, e.target.value]);
                }
              }}
            />
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
        
        {/* Submit button */}
        <div className="mt-4 text-right">
          <button type="submit" className="btn">
            Filter anwenden
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterBar;