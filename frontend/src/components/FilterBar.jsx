import React, { useEffect, useMemo, useState } from 'react';

const FilterBar = ({
  onFilterChange,
  ageGroupOptions = [],
  themeOptions = [],
  placeOptions = [],
  dateOptions = [],
  disabled = false,
}) => {
  const [ageGroups, setAgeGroups] = useState(ageGroupOptions);
  const [inclusion, setInclusion] = useState(false);
  const [free, setFree] = useState(false);
  const [eventType, setEventType] = useState('all'); // 'all', 'einmalig', 'regelmäßig'
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);

  const normalizedAgeGroupOptions = useMemo(
    () => ageGroupOptions.map((group) => group?.trim()).filter(Boolean),
    [ageGroupOptions],
  );

  useEffect(() => {
    if (normalizedAgeGroupOptions.length === 0) {
      setAgeGroups([]);
      return;
    }

    setAgeGroups((prev) => {
      if (!prev || prev.length === 0) {
        return [...normalizedAgeGroupOptions];
      }
      const filtered = prev.filter((group) => normalizedAgeGroupOptions.includes(group));
      return filtered.length > 0 ? filtered : [...normalizedAgeGroupOptions];
    });
  }, [normalizedAgeGroupOptions]);

  const syncSelected = (selected, options) =>
    selected.filter((value) => options.includes(value));

  useEffect(() => {
    setSelectedThemes((prev) => syncSelected(prev, themeOptions));
  }, [themeOptions]);

  useEffect(() => {
    setSelectedPlaces((prev) => syncSelected(prev, placeOptions));
  }, [placeOptions]);

  useEffect(() => {
    setSelectedDates((prev) => syncSelected(prev, dateOptions));
  }, [dateOptions]);
  
  const toggleAgeGroup = (group) => {
    setAgeGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  useEffect(() => {
    onFilterChange?.({
      ageGroups,
      inclusion,
      free,
      eventType,
      themes: selectedThemes,
      places: selectedPlaces,
      dates: selectedDates,
    });

  }, [ageGroups, inclusion, free, eventType, selectedThemes, selectedPlaces, selectedDates]);

  
  return (
    <div className="bg-white p-6">
      {/* Age groups and options row */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold mr-2">Angebote für...</span>
            {normalizedAgeGroupOptions.map(group => (
              <button
                key={group}
                type="button"
                disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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

        <div className="bg-black text-white grid grid-cols-3 items-center w-full py-2">
          <span className="text-sm text-center">regelmäßige Angebote</span>
          <div className="flex justify-center items-center">
            <input
              type="range"
              min="0"
              max="2"
              value={eventType === 'regelmäßig' ? 0 : eventType === 'all' ? 1 : 2}
              disabled={disabled}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setEventType(val === 0 ? 'regelmäßig' : val === 1 ? 'all' : 'einmalig');
              }}

              className="filter-range w-24"
            />
          </div>
          <span className="text-sm text-center">einmalige Veranstaltungen</span>
        </div>
      </div>

      {/* Dropdowns row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Themes dropdown */}
          <div className="relative">
            <select
              className="w-full p-2 border-2 border-black rounded-none appearance-none focus:outline-none"
              disabled={disabled}
              onChange={(e) => {
                const value = e.target.value;
                if (value && !selectedThemes.includes(value)) {
                  setSelectedThemes(prev => [...prev, value]);
                }
                e.target.value = '';
              }}
            >
              <option value="">Themen</option>
              {themeOptions.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center justify-center">
              <svg className="w-1/2 h-1/2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
                      onClick={() => setSelectedThemes(prev => prev.filter(t => t !== theme))}
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
              disabled={disabled}
              onChange={(e) => {
                const value = e.target.value;
                if (value && !selectedPlaces.includes(value)) {
                  setSelectedPlaces(prev => [...prev, value]);
                }
                e.target.value = '';
              }}
            >
              <option value="">Orte</option>
              {placeOptions.map(place => (
                <option key={place} value={place}>{place}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center justify-center">
              <svg className="w-1/2 h-1/2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
                      onClick={() => setSelectedPlaces(prev => prev.filter(p => p !== place))}
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
              disabled={disabled}
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => (e.target.type = 'text')}
              onChange={(e) => {
                const value = e.target.value;
                if (value && !selectedDates.includes(value)) {
                  setSelectedDates(prev => [...prev, value]);
                }
                e.target.value = '';
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center justify-center">
              <svg className="w-1/2 h-1/2 text-green-600" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
                      onClick={() => setSelectedDates(prev => prev.filter(d => d !== date))}
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
