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

// Export bounds for use in other components (e.g., coordinate validation)
export { MAP_BOUNDS };

/**
 * Check if coordinates are within Moabit map bounds
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if within bounds
 */
export function isWithinMoabitBounds(lat, lng) {
  if (lat == null || lng == null) return false;
  const margin = 0.01; // ~1km margin for validation warnings
  return (
    lat >= MAP_BOUNDS.south - margin &&
    lat <= MAP_BOUNDS.north + margin &&
    lng >= MAP_BOUNDS.west - margin &&
    lng <= MAP_BOUNDS.east + margin
  );
}

/**
 * Convert GPS coordinates to map percentage position
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} clampToEdge - If true, clamp out-of-bounds coords to edge instead of returning null
 * @returns {{ x: number, y: number, isOutOfBounds: boolean } | null} - Percentage position or null
 */
function gpsToMapPosition(lat, lng, clampToEdge = true) {
  if (lat == null || lng == null) return null;
  
  // Calculate percentage position
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  
  // Check if out of bounds
  const isOutOfBounds = x < 0 || x > 100 || y < 0 || y > 100;
  
  // If out of bounds and not clamping, return null (only for very far locations)
  const margin = 20; // 20% margin before rejecting
  if (!clampToEdge && (x < -margin || x > 100 + margin || y < -margin || y > 100 + margin)) {
    return null;
  }
  
  // Clamp to 0-100
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    isOutOfBounds,
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
          return { ...place, calculatedPosition: { ...place.mapPosition, isOutOfBounds: false } };
        }
        // Otherwise try to calculate from GPS coordinates
        if (place.coordinates?.lat != null && place.coordinates?.lng != null) {
          const position = gpsToMapPosition(place.coordinates.lat, place.coordinates.lng, true);
          if (position) {
            return { ...place, calculatedPosition: position };
          }
        }
        return null;
      })
      .filter(Boolean);
    
    // Debug: log how many places have positions
    if (process.env.NODE_ENV === 'development') {
      console.log(`MapView: ${results.length}/${sortedPlaces.length} places have map positions`);
      const outOfBounds = results.filter(p => p.calculatedPosition?.isOutOfBounds);
      if (outOfBounds.length > 0) {
        console.log('Places at edge (out of bounds):', outOfBounds.map(p => p.shortName || p.name));
      }
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
            const isOutOfBounds = position.isOutOfBounds;

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
                    {isOutOfBounds && <span className="ml-1 text-yellow-300">(außerhalb)</span>}
                  </div>
                )}
                <button
                  type="button"
                  className={`-translate-x-1/2 -translate-y-full transition-all duration-200 ${
                    isHovered ? 'scale-125 z-10' : 'scale-100'
                  } ${isOutOfBounds ? 'opacity-60' : ''}`}
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
