import React, { useMemo, useState } from 'react';
import mapImage from '../assets/Moabit.png';
import arrowGreen from '../assets/pfad_pfeil.png';
import arrowYellow from '../assets/pfad_pfeil_hover.png';

const MapView = ({ places = [], onPlaceSelect = () => {}, loading = false }) => {
  const [hoveredPlace, setHoveredPlace] = useState(null);

  const sortedPlaces = useMemo(
    () =>
      places
        .map((place) => place)
        .filter((place) => place && place.id)
        .sort((a, b) => {
          const aName = a.shortName ?? a.name ?? '';
          const bName = b.shortName ?? b.name ?? '';
          return aName.localeCompare(bName, 'de-DE');
        }),
    [places],
  );

  const markerPlaces = sortedPlaces.filter(
    (place) => place.mapPosition?.x != null && place.mapPosition?.y != null,
  );

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">
        HIER FINDET IHR EURE MITTE IN MOABIT
      </h2>
      <p className="mb-4">
        {loading
          ? 'Lade Orte …'
          : `${sortedPlaces.length} Standorte sind im MoaFinder erfasst. Wählt einen Wimpel in der interaktiven Karte oder nutzt die Liste unten – schon stellt sich der Ort vor.`}
      </p>

      <div className="flex justify-end mb-2">
        <a href="mailto:moafinder@moabit.world" className="text-green-600 hover:text-green-800 font-semibold">
          Neuen Standort melden
        </a>
      </div>

      {markerPlaces.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          {loading
            ? 'Karte wird geladen …'
            : 'Für die Karte sind noch keine Koordinaten hinterlegt. Nutze die Liste unten, um Orte zu öffnen.'}
        </div>
      ) : (
        <div className="relative w-full bg-blue-500 rounded-lg overflow-hidden">
          <img src={mapImage} alt="Moabit Karte" className="w-full h-auto" />

          {markerPlaces.map((place) => {
            const isHovered = hoveredPlace === place.id;
            const position = place.mapPosition;

            return (
              <button
                key={place.id}
                type="button"
                className={`absolute -translate-x-1/2 -translate-y-full transition-all duration-200 ${
                  isHovered ? 'scale-125 z-10' : 'scale-100'
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onMouseEnter={() => setHoveredPlace(place.id)}
                onMouseLeave={() => setHoveredPlace(null)}
                onClick={() => onPlaceSelect(place)}
              >
                <img
                  src={isHovered ? arrowYellow : arrowGreen}
                  alt={place.shortName ?? place.name ?? 'Ort'}
                  className="w-6 h-8"
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {sortedPlaces.map((place) => (
          <button
            key={place.id}
            type="button"
            className={`text-left p-2 rounded transition-all duration-200 ${
              hoveredPlace === place.id ? 'bg-gray-100 font-bold text-lg' : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => setHoveredPlace(place.id)}
            onMouseLeave={() => setHoveredPlace(null)}
            onClick={() => onPlaceSelect(place)}
          >
            {place.shortName ?? place.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapView;
