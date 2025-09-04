import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { createEvent } from '../api/events';

export default function EventCreate() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await createEvent(data);
    navigate('/events');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Event erstellen</h1>
      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}
