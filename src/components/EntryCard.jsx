import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Card component for displaying a content entry (e.g. article, event,
 * news post). Accepts an entry object containing id, title, image,
 * date and excerpt. Cards link to the detail view of the entry.
 */
const EntryCard = ({ entry }) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {entry.image && (
        <Link to={`/entries/${entry.id}`}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={entry.image}
            className="w-full h-40 object-cover"
            alt={entry.title}
          />
        </Link>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          <Link to={`/entries/${entry.id}`} className="hover:underline">
            {entry.title}
          </Link>
        </h3>
        {entry.date && (
          <p className="text-xs text-gray-500 mb-2">
            {new Date(entry.date).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {entry.excerpt && (
          <p className="text-sm text-gray-700">
            {entry.excerpt.length > 100
              ? `${entry.excerpt.slice(0, 100)}…`
              : entry.excerpt}
          </p>
        )}
      </div>
    </div>
  );
};

export default EntryCard;