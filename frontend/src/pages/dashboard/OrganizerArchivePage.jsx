import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { updateEvent } from '../../api/events';
import ListCard from './components/ListCard';
import { getListColor } from '../../utils/colorPalette';
import { withAuthHeaders } from '../../utils/authHeaders';

const OrganizerArchivePage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          'where[organizer][equals]': user.id,
          sort: '-updatedAt',
          limit: 200,
        });
        const response = await fetch(buildApiUrl(`/api/events?${params.toString()}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        if (!response.ok) throw new Error('Archiv konnte nicht geladen werden');
        const data = await response.json();
        if (mounted) {
          const archived = Array.isArray(data.docs) ? data.docs.filter((event) => event.status === 'archived') : [];
          setEvents(archived);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Archiv konnte nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const sorted = useMemo(
    () => events.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [events],
  );

  const handleRestore = async (id) => {
    try {
      setProcessingId(id);
      await updateEvent(id, { status: 'pending' });
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wiederherstellung fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Archiv</p>
        <h1 className="text-3xl font-bold text-gray-900">Archivierte Veranstaltungen</h1>
        <p className="text-sm text-gray-600">
          Reaktiviere ältere Veranstaltungen, um sie erneut zur Prüfung einzureichen oder weiter zu bearbeiten.
        </p>
      </header>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Lade archivierte Veranstaltungen …
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine archivierten Veranstaltungen vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((event, index) => (
            <ListCard
              key={event.id ?? index}
              color={getListColor(index)}
              title={event.title ?? 'Ohne Titel'}
              subtitle={event.subtitle}
              meta={`Archiviert am ${format(new Date(event.updatedAt), 'dd.MM.yyyy', { locale: de })}`}
            >
              <p className="text-sm text-gray-600">
                {event.location ?? 'Ort folgt'} · Erstellt am{' '}
                {format(new Date(event.createdAt), 'dd.MM.yyyy', { locale: de })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleRestore(event.id)}
                  disabled={processingId === event.id}
                  className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processingId === event.id ? 'Reaktivieren …' : 'Reaktivieren'}
                </button>
                <a
                  href={`/dashboard/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                >
                  Bearbeiten
                </a>
              </div>
            </ListCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerArchivePage;
