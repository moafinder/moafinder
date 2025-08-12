import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { EVENTS } from '../data/mockData';

const EventDetail = () => {
  const { id } = useParams();
  const event = EVENTS.find(e => e.id === parseInt(id));
  
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Veranstaltung nicht gefunden</h2>
        <Link to="/" className="text-green-600 hover:text-green-800 font-bold">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/" className="text-green-600 hover:text-green-800 font-bold">
        ← Formate
      </Link>
      
      <h1 className="text-3xl font-bold mt-4 mb-2">{event.title}</h1>
      
      <div className="mb-4">
        <p className="text-gray-600">
          <strong>{event.placeShort}</strong> ({event.place})
        </p>
        <p className="text-gray-600">
          {new Date(event.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {event.time && ` / ${event.time}`}
        </p>
        <p className="text-sm text-gray-500 mt-1">{event.type}</p>
      </div>
      
      <div className={`w-full h-64 ${event.color} mb-6`}>
        {event.image && (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className="prose max-w-none">
        <p className="text-lg">{event.excerpt}</p>
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Angebot für:</h3>
          <p>{event.category}</p>
          
          {event.address && (
            <>
              <h3 className="font-bold mt-4 mb-2">Adresse:</h3>
              <p className="text-green-600 font-bold">{event.address}</p>
            </>
          )}
          
          <h3 className="font-bold mt-4 mb-2">Angeboten von:</h3>
          <p>Bezeichnung des Anbieters</p>
          <p>kontakt@angebot.de</p>
          <a href="www.moabit.world" className="text-green-600 hover:text-green-800 font-bold">
            www.homepage.de
          </a>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;