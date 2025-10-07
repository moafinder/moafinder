import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrganizerEventForm from './components/OrganizerEventForm';
import { getEvent, updateEvent } from '../../api/events';

const OrganizerEventEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getEvent(id, { depth: 1 });
        if (mounted) {
          setEventData(data);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Veranstaltung konnte nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (payload, status) => {
    try {
      await updateEvent(id, payload);
      navigate('/dashboard/events', { replace: true, state: { message: getSuccessMessage(status) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktualisieren fehlgeschlagen');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-600">Lade Veranstaltung …</p>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!eventData) {
    return <p className="text-sm text-gray-600">Veranstaltung nicht gefunden.</p>;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Veranstaltung bearbeiten</p>
        <h1 className="text-3xl font-bold text-gray-900">{eventData.title ?? 'Ohne Titel'}</h1>
      </header>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <OrganizerEventForm initialEvent={eventData} onSubmit={handleSubmit} />
    </div>
  );
};

function getSuccessMessage(status) {
  if (status === 'draft') return 'Entwurf aktualisiert.';
  if (status === 'pending') return 'Veranstaltung erneut eingereicht.';
  return 'Veranstaltung gespeichert.';
}

export default OrganizerEventEditPage;
