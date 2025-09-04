import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, deleteEvent } from '../api/events';

export default function EventsList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    listEvents().then(setEvents).catch(console.error);
  }, []);

  const remove = async (id) => {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <Link to="/events/new" className="bg-green-600 text-white px-4 py-2 rounded">
        Neues Event
      </Link>
      <ul className="mt-4 space-y-2">
        {events.map((ev) => (
          <li key={ev.id} className="border p-2 flex justify-between">
            <Link to={`/events/${ev.id}/edit`} className="text-green-700">
              {ev.title}
            </Link>
            <button onClick={() => remove(ev.id)} className="text-red-600">
              Löschen
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
