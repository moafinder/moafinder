import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  const dateInputRef = useRef(null);
  const [dateMode, setDateMode] = useState(false);

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

  const openNativeDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    // Switch to native date input and try to open the picker
    if (el.type !== 'date') {
      try {
        el.type = 'date';
        setDateMode(true);
      } catch (_) {
        // ignore
      }
    }
    try {
      // showPicker is supported in modern browsers including iOS 16+
      if (typeof el.showPicker === 'function') {
        el.showPicker();
      } else {
        // Fallback: focus the element to trigger the native UI
        el.focus();
      }
    } catch (_) {
      // Some browsers throw if called while hidden; ignore
      el.focus();
    }
  };

  const onDateChange = (e) => {
    const value = e.target.value;
    if (value && !selectedDates.includes(value)) {
      setSelectedDates((prev) => [...prev, value]);
    }
    // Clear input and revert to text to keep layout stable
    e.target.value = '';
    // Defer to allow native UI to close gracefully
    setTimeout(() => {
      if (dateInputRef.current) {
        try {
          dateInputRef.current.type = 'text';
        } catch (_) {}
      }
      setDateMode(false);
    }, 0);
  };

  
  return (
    <div className="bg-white p-4 md:p-6">
      {/* Age groups and options row */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="font-semibold mr-2 text-sm md:text-base">Angebote für...</span>
            {normalizedAgeGroupOptions.map(group => (
              <button
                key={group}
                type="button"
                disabled={disabled}
                onClick={() => toggleAgeGroup(group)}
                className={`px-3 md:px-4 py-2 min-h-[44px] rounded-full border-2 text-sm transition-colors touch-manipulation ${
                  ageGroups.includes(group)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {ageGroups.includes(group) && <span className="mr-1">✓</span>}
                {group}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setInclusion(!inclusion)}
              disabled={disabled}
              className={`relative px-3 md:px-4 py-2 min-h-[44px] rounded-full border-2 text-sm transition-colors group touch-manipulation ${
                inclusion
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {inclusion && <span className="mr-1">✓</span>}
              Inklusion*
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded w-48 z-10">
                Barrierefreie Angebote und Veranstaltungen
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFree(!free)}
              disabled={disabled}
              className={`px-3 md:px-4 py-2 min-h-[44px] rounded-full border-2 text-sm transition-colors touch-manipulation ${
                free
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {free && <span className="mr-1">✓</span>}
              kostenlos
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

              className="filter-range w-48"
            />
          </div>
          <span className="text-sm text-center">einmalige Veranstaltungen</span>
        </div>
      </div>

      {/* Dropdowns row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Themes dropdown */}
          <div>
            <div className="relative">
              <select
                className={`w-full p-3 min-h-[44px] pr-12 border-2 rounded-none appearance-none focus:outline-none focus:border-brand transition-colors ${
                  selectedThemes.length > 0 ? 'border-brand bg-green-50' : 'border-black'
                }`}
                disabled={disabled}
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !selectedThemes.includes(value)) {
                    setSelectedThemes(prev => [...prev, value]);
                  }
                  // Reset select to placeholder after selection
                  e.target.value = '';
                }}
              >
                <option value="" disabled>
                  Themen{selectedThemes.length > 0 ? ` (${selectedThemes.length} ausgewählt)` : ''}
                </option>
                {themeOptions.map(theme => (
                  <option key={theme} value={theme}>
                    {selectedThemes.includes(theme) ? '✓ ' : ''}{theme}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-3">
                <svg className="w-5 h-3 text-brand" viewBox="0 0 12 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0l6 8 6-8H0z" />
                </svg>
              </span>
            </div>
            {selectedThemes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedThemes.map(theme => (
                  <span key={theme} className="bg-green-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <span className="text-green-600">✓</span> {theme}
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
          <div>
            <div className="relative">
              <select
                className={`w-full p-3 min-h-[44px] pr-12 border-2 rounded-none appearance-none focus:outline-none focus:border-brand transition-colors ${
                  selectedPlaces.length > 0 ? 'border-brand bg-green-50' : 'border-black'
                }`}
                disabled={disabled}
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !selectedPlaces.includes(value)) {
                    setSelectedPlaces(prev => [...prev, value]);
                  }
                  // Reset select to placeholder after selection
                  e.target.value = '';
                }}
              >
                <option value="" disabled>
                  Orte{selectedPlaces.length > 0 ? ` (${selectedPlaces.length} ausgewählt)` : ''}
                </option>
                {placeOptions.map(place => (
                  <option key={place} value={place}>
                    {selectedPlaces.includes(place) ? '✓ ' : ''}{place}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-3">
                <svg className="w-5 h-3 text-brand" viewBox="0 0 12 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0l6 8 6-8H0z" />
                </svg>
              </span>
            </div>
            {selectedPlaces.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedPlaces.map(place => (
                  <span key={place} className="bg-green-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <span className="text-green-600">✓</span> {place}
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
          <div>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="text"
                inputMode="none"
                placeholder={selectedDates.length > 0 ? `Termine (${selectedDates.length} ausgewählt)` : 'Termine'}
                className={`w-full p-3 min-h-[44px] pr-12 border-2 rounded-none appearance-none focus:outline-none focus:border-brand transition-colors ${
                  selectedDates.length > 0 ? 'border-brand bg-green-50' : 'border-black'
                }`}
                disabled={disabled}
                onFocus={openNativeDatePicker}
                onClick={openNativeDatePicker}
                onChange={onDateChange}
                aria-label="Termine wählen"
                readOnly
              />
              <button
                type="button"
                className="absolute top-0 right-0 h-full w-12 min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation"
                onClick={openNativeDatePicker}
                aria-label="Kalender öffnen"
                tabIndex={-1}
              >
                <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>
            {selectedDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedDates.map(date => (
                  <span key={date} className="bg-green-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <span className="text-green-600">✓</span> {new Date(date).toLocaleDateString('de-DE')}
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
