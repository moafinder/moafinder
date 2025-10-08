import React, { useState } from 'react';
import MapView from '../components/MapView';
import PlaceCard from '../components/PlaceCard';
import headerGraphic from '../assets/header_grafik_klein.png';

/**
 * Homepage displaying a searchable list of places alongside an
 * interactive map. Includes a search bar and optional filtering
 * controls. For demonstration purposes this page uses static
 * placeholder data – replace this with real data loaded from your
 * backend or CMS.
 */
const HomePage = () => {
  // Example data; in a real application you would fetch this from
  // your API. lat/lng coordinates are approximate values within
  // Moabit. Extend this list with more fields as needed.
  const initialPlaces = [
    {
      id: 1,
      name: 'Teehaus Moabit',
      categories: ['Café', 'Kultur'],
      description: 'Gemütliches Teehaus mit Veranstaltungen und Lesungen.',
      image: 'https://source.unsplash.com/400x300/?cafe',
      lat: 52.523, 
      lng: 13.339,
    },
    {
      id: 2,
      name: 'Öffentliche Bibliothek',
      categories: ['Bildung', 'Öffentlich'],
      description: 'Die Bezirksbibliothek bietet eine große Auswahl an Büchern und Medien.',
      image: 'https://source.unsplash.com/400x300/?library',
      lat: 52.526,
      lng: 13.344,
    },
    {
      id: 3,
      name: 'Markthalle Moabit',
      categories: ['Einkaufen'],
      description: 'Frische regionale Produkte und Streetfood in historischer Markthalle.',
      image: 'https://source.unsplash.com/400x300/?market',
      lat: 52.527,
      lng: 13.341,
    },
  ];

  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Filter places based on search query. The search is performed on
  // both name and categories to provide a simple fuzzy search.
  const filtered = initialPlaces.filter((place) => {
    const query = search.toLowerCase();
    return (
      place.name.toLowerCase().includes(query) ||
      place.categories.some((cat) => cat.toLowerCase().includes(query))
    );
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero banner with graphic and tagline */}
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
      <h1 className="text-2xl font-bold mb-4">Entdecke Orte in Moabit</h1>
      <div className="mb-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Suche nach Name oder Kategorie"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-col md:flex-row md:space-x-6">
        <div className="md:w-7/12">
          <MapView
            places={filtered}
            onPlaceSelect={(place) => setSelectedPlace(place)}
          />
        </div>
        <div className="md:w-5/12 mt-6 md:mt-0 space-y-4">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-600">Keine Orte gefunden.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
