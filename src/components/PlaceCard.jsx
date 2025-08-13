import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A reusable component that displays a preview of a place. This
 * component can be used in lists and on the map. It accepts a
 * `place` object containing id, name, image, categories and a
 * short description.
 */
const PlaceCard = ({ place }) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {place.image && (
        <Link to={`/place/${place.id}`}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={place.image}
            className="w-full h-40 object-cover"
            alt={place.name}
          />
        </Link>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          <Link to={`/place/${place.id}`} className="hover:underline">
            {place.name}
          </Link>
        </h3>
        {place.categories && (
          <p className="text-sm text-gray-500 mb-2">
            {place.categories.join(', ')}
          </p>
        )}
        {place.description && (
          <p className="text-sm text-gray-700">
            {place.description.length > 100
              ? `${place.description.slice(0, 100)}…`
              : place.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;