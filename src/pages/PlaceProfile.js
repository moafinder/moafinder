import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MapView from '../components/MapView';

/**
 * Detailed page for a specific place. Displays full information
 * including images, description, categories, location map and
 * additional content such as contact details or website links.
 */
const PlaceProfile = () => {
  const { id } = useParams();
  const placeId = parseInt(id, 10);

  // In a real application you would load the place data based on
  // the URL parameter. Here we reuse the mock data from HomePage.
  const places = [
    {
      id: 1,
      name: 'Teehaus Moabit',
      categories: ['Café', 'Kultur'],
      description:
        'Gemütliches Teehaus mit Veranstaltungen und Lesungen. Hier können Sie entspannen, Tee genießen und kulturelle Events besuchen.',
      image: 'https://source.unsplash.com/800x600/?cafe',
      lat: 52.523,
      lng: 13.339,
      address: 'Alt-Moabit 23, 10555 Berlin',
      phone: '+49 30 12345678',
      website: 'https://teehaus-moabit.de',
    },
    {
      id: 2,
      name: 'Öffentliche Bibliothek',
      categories: ['Bildung', 'Öffentlich'],
      description:
        'Die Bezirksbibliothek bietet eine große Auswahl an Büchern, Zeitschriften und digitalen Medien. Öffnungszeiten: Mo–Fr 10–18 Uhr.',
      image: 'https://source.unsplash.com/800x600/?library',
      lat: 52.526,
      lng: 13.344,
      address: 'Turmstraße 75, 10551 Berlin',
      phone: '+49 30 987654321',
      website: 'https://bibliothek-moabit.de',
    },
    {
      id: 3,
      name: 'Markthalle Moabit',
      categories: ['Einkaufen'],
      description:
        'Frische regionale Produkte und Streetfood in historischer Markthalle. Jeden Mittwoch, Freitag und Samstag geöffnet.',
      image: 'https://source.unsplash.com/800x600/?market',
      lat: 52.527,
      lng: 13.341,
      address: 'Wilsnacker Str. 61, 10559 Berlin',
      phone: '+49 30 24681012',
      website: 'https://markthalle-moabit.de',
    },
  ];

  const place = places.find((p) => p.id === placeId);

  if (!place) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ort nicht gefunden</h2>
        <Link to="/" className="text-primary-700 hover:underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/" className="text-primary-700 hover:underline">← Zurück zur Übersicht</Link>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
          <p className="text-gray-500 mb-4">{place.categories.join(', ')}</p>
          <p className="text-gray-700 mb-4">{place.description}</p>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Adresse</h2>
            <p>{place.address}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Kontakt</h2>
            <p>Telefon: <a href={`tel:${place.phone}`} className="text-primary-700 hover:underline">{place.phone}</a></p>
            <p>Website: <a href={place.website} className="text-primary-700 hover:underline" target="_blank" rel="noopener noreferrer">{place.website.replace(/^https?:\/\//, '')}</a></p>
          </div>
        </div>
      </div>
      <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Lage</h2>
          <MapView places={[place]} onSelect={() => {}} height="350px" />
      </div>
    </div>
  );
};

export default PlaceProfile;