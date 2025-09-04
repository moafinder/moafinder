import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { getEvent, updateEvent } from '../api/events';

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    getEvent(id).then(setEvent);
  }, [id]);

  const handleSubmit = async (data) => {
    await updateEvent(id, data);
    navigate('/events');
  };

  if (!event) return <p className="p-4">Laden...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Event bearbeiten</h1>
      <EventForm initialData={event} onSubmit={handleSubmit} />
    </div>
  );
}
