import React, { useMemo, useState } from 'react';
import mapImage from '../assets/Moabit.png';
import arrowGreen from '../assets/pfad_pfeil.png';
import arrowYellow from '../assets/pfad_pfeil_hover.png';

// Moabit map bounds (approximate GPS coordinates that cover the map image)
// These define the corners of the Moabit.png map
const MAP_BOUNDS = {
  north: 52.542,  // Top of map (latitude)
  south: 52.516,  // Bottom of map (latitude)
  west: 13.315,   // Left of map (longitude)
  east: 13.385,   // Right of map (longitude)
};

/**
 * Convert GPS coordinates to map percentage position
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {{ x: number, y: number } | null} - Percentage position or null if out of bounds
 */
function gpsToMapPosition(lat, lng) {
  if (lat == null || lng == null) return null;
  
  // Check if coordinates are within map bounds (with some margin)
  const margin = 0.005; // ~500m margin
  if (
    lat < MAP_BOUNDS.south - margin ||
    lat > MAP_BOUNDS.north + margin ||
    lng < MAP_BOUNDS.west - margin ||
    lng > MAP_BOUNDS.east + margin
  ) {
    return null;
  }
  
  // Calculate percentage position
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  
  // Clamp to 0-100
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

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

  // Calculate map positions from GPS coordinates or use existing mapPosition
  const markerPlaces = useMemo(() => {
    const results = sortedPlaces
      .map((place) => {
        // If mapPosition is already set with valid values, use it
        if (place.mapPosition?.x != null && place.mapPosition?.y != null) {
          return { ...place, calculatedPosition: place.mapPosition };
        }
        // Otherwise try to calculate from GPS coordinates
        if (place.coordinates?.lat != null && place.coordinates?.lng != null) {
          const position = gpsToMapPosition(place.coordinates.lat, place.coordinates.lng);
          if (position) {
            return { ...place, calculatedPosition: position };
          }
        }
        return null;
      })
      .filter(Boolean);
    
    // Debug: log how many places have positions
    console.log(`MapView: ${results.length}/${sortedPlaces.length} places have map positions`);
    if (results.length < sortedPlaces.length) {
      const missing = sortedPlaces.filter(p => !results.find(r => r.id === p.id));
      console.log('Places without positions:', missing.map(p => ({
        name: p.shortName || p.name,
        coords: p.coordinates,
        mapPos: p.mapPosition
      })));
    }
    
    return results;
  }, [sortedPlaces]);

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
            const position = place.calculatedPosition;
            const placeName = place.shortName ?? place.name ?? 'Ort';

            return (
              <div
                key={place.id}
                className="absolute"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                {/* Tooltip - shows on hover */}
                {isHovered && (
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none"
                  >
                    {placeName}
                  </div>
                )}
                <button
                  type="button"
                  className={`-translate-x-1/2 -translate-y-full transition-all duration-200 ${
                    isHovered ? 'scale-125 z-10' : 'scale-100'
                  }`}
                  onMouseEnter={() => setHoveredPlace(place.id)}
                  onMouseLeave={() => setHoveredPlace(null)}
                  onClick={() => onPlaceSelect(place)}
                >
                  <img
                    src={isHovered ? arrowYellow : arrowGreen}
                    alt={placeName}
                    className="w-6 h-8"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {sortedPlaces.map((place) => {
          const isHovered = hoveredPlace === place.id;
          return (
            <button
              key={place.id}
              type="button"
              className={`text-left p-2 rounded transition-colors duration-200 min-h-[2.5rem] ${
                isHovered ? 'bg-[#FFD966] text-black' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredPlace(place.id)}
              onMouseLeave={() => setHoveredPlace(null)}
              onClick={() => onPlaceSelect(place)}
            >
              <span className={isHovered ? 'font-semibold' : ''}>
                {place.shortName ?? place.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapView;
