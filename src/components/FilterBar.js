// src/components/FilterBar.js

import React, { useState } from 'react';

/**
 * Filter bar for the Formate page. Allows users to refine the
 * displayed events by target audience, event type, theme, location
 * and date. Calls the provided onFilterChange callback with the
 * updated filter state when the form is submitted.
 */
const FilterBar = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [eventType, setEventType] = useState('');
  const [topics, setTopics] = useState('');
  const [location, setLocation] = useState('');
  const [dates, setDates] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      categories,
      eventType,
      topics,
      location,
      dates,
    });
  };

  const toggleCategory = (value) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex flex-wrap gap-4">
        <fieldset>
          <legend className="font-semibold mb-1">Zielgruppen</legend>
          <label className="block">
            <input
              type="checkbox"
              checked={categories.includes('Kinder')}
              onChange={() => toggleCategory('Kinder')}
            />
            <span className="ml-2">Kinder</span>
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={categories.includes('Jugendliche')}
              onChange={() => toggleCategory('Jugendliche')}
            />
            <span className="ml-2">Jugendliche</span>
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={categories.includes('Erwachsene')}
              onChange={() => toggleCategory('Erwachsene')}
            />
            <span className="ml-2">Erwachsene</span>
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={categories.includes('Inklusion')}
              onChange={() => toggleCategory('Inklusion')}
            />
            <span className="ml-2">Inklusion*</span>
          </label>
        </fieldset>

        <div>
          <label htmlFor="eventType" className="block font-semibold mb-1">Veranstaltungstyp</label>
          <select
            id="eventType"
            className="p-1 border rounded"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="">Alle</option>
            <option value="Vortrag">Vortrag</option>
            <option value="Workshop">Workshop</option>
            <option value="Performance">Performance</option>
          </select>
        </div>

        <div>
          <label htmlFor="topics" className="block font-semibold mb-1">Themen</label>
          <select
            id="topics"
            className="p-1 border rounded"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
          >
            <option value="">Alle</option>
            <option value="Migration">Migration</option>
            <option value="Kunst">Kunst</option>
            <option value="Gesellschaft">Gesellschaft</option>
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block font-semibold mb-1">Ort</label>
          <select
            id="location"
            className="p-1 border rounded"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Alle Orte</option>
            <option value="Kiez A">Kiez A</option>
            <option value="Kiez B">Kiez B</option>
          </select>
        </div>

        <div>
          <label htmlFor="dates" className="block font-semibold mb-1">Termine</label>
          <input
            id="dates"
            type="text"
            className="p-1 border rounded"
            placeholder="z. B. 12.08. oder Woche 33"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
          />
        </div>

        <div className="self-end">
          <button type="submit" className="btn bg-green-700 text-white hover:bg-green-800 px-4 py-2 rounded">
            Filtern
          </button>
        </div>
      </div>
    </form>
  );
};

export default FilterBar;
