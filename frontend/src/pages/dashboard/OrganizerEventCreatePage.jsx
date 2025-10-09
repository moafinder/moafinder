import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizerEventForm from './components/OrganizerEventForm';
import { createEvent } from '../../api/events';

const OrganizerEventCreatePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (payload, status) => {
    try {
      await createEvent(payload);
      navigate('/dashboard/events', { replace: true, state: { message: getSuccessMessage(status) } });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Neue Veranstaltung</p>
        <h1 className="text-3xl font-bold text-gray-900">Angebot einreichen</h1>
        <p className="text-sm text-gray-600">Fülle alle Felder aus und reiche dein Angebot zur redaktionellen Prüfung ein.</p>
      </header>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <OrganizerEventForm onSubmit={handleSubmit} />
    </div>
  );
};

function getSuccessMessage(status) {
  if (status === 'draft') return 'Entwurf gespeichert.';
  if (status === 'pending') return 'Veranstaltung eingereicht. Die Redaktion prüft den Beitrag.';
  return 'Veranstaltung gespeichert.';
}

export default OrganizerEventCreatePage;

function extractErrorMessage(err) {
  if (!err) return 'Erstellen fehlgeschlagen.';
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
      return parsed.errors[0].message ?? 'Bitte prüfe die Eingaben.';
    }
  } catch {
    // ignore
  }
  if (/ValidationError/i.test(raw)) {
    return 'Bitte prüfe die Eingaben. Pflichtfelder sind erforderlich.';
  }
  return raw || 'Erstellen fehlgeschlagen.';
}
