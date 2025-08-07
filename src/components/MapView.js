import React from 'react';
// The following imports assume you have installed react-leaflet and
// leaflet as dependencies. They will not work until you run
// `npm install react-leaflet leaflet` in your project root. You can
// replace this implementation with another mapping library (e.g.
// Google Maps) if preferred.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Map view component. Displays a Leaflet map with markers for each
 * place. When a marker is clicked, a popup with the place name
 * appears. The `onSelect` callback is triggered when a marker is
 * clicked, allowing the parent component to display details.
 */
const MapView = ({ places, onSelect, height = '400px' }) => {
  // Default center is roughly the Moabit district in Berlin. When
  // places contain coordinates, you could compute a bounding box
  // instead. Coordinates should be objects with lat and lng values.
  const defaultCenter = [52.525, 13.342];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          eventHandlers={{
            click: () => onSelect && onSelect(place),
          }}
        >
          <Popup>{place.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;