import React, { useEffect, useMemo, useState } from 'react';
import { listEvents, updateEvent } from '../../api/events';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EditorArchivePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listEvents({ 'where[status][equals]': 'archived', depth: 1, limit: 200, sort: '-updatedAt' });
        if (mounted) setEvents(Array.isArray(data.docs) ? data.docs : []);
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
  }, []);

  const filtered = useMemo(() => {
    if (!search) return events;
    return events.filter((event) => (event.title ?? '').toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

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
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Archiv</h1>
        <p className="text-sm text-gray-600">Inaktive Veranstaltungen. Du kannst sie bei Bedarf reaktivieren.</p>
      </header>

      <input
        type="search"
        placeholder="Veranstaltung suchen …"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-80"
      />

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade archivierte Veranstaltungen …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Keine archivierten Veranstaltungen vorhanden.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <article key={event.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{event.title ?? 'Ohne Titel'}</h2>
                  <p className="text-sm text-gray-600">{event.subtitle}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Archiviert am {format(new Date(event.updatedAt), 'dd.MM.yyyy', { locale: de })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(event.id)}
                    disabled={processingId === event.id}
                    className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Reaktivieren
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorArchivePage;
