import React, { useEffect, useMemo, useState } from 'react';
import EditorLayout from './EditorLayout';
import { listEvents, updateEvent } from '../../api/events';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusOptions = [
  { value: 'pending', label: 'In Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
];

const EditorEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('pending');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listEvents({ depth: 2, limit: 200, sort: '-updatedAt' });
        if (mounted) {
          setEvents(Array.isArray(data.docs) ? data.docs : []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Veranstaltungen konnten nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return events.reduce((acc, event) => {
      const status = event.status ?? 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const filtered = useMemo(() => events.filter((event) => (activeFilter === 'all' ? true : event.status === activeFilter)), [events, activeFilter]);

  const handleDecision = async (eventId, status) => {
    try {
      setProcessingId(eventId);
      await updateEvent(eventId, { status });
      setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, status } : event)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Statusaktualisierung fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Veranstaltungen prüfen</h1>
        <p className="text-sm text-gray-600">Sichte neue Einreichungen, gib sie frei oder sende Feedback an die Veranstalter*innen.</p>
      </header>

      <EditorLayout counts={counts} activeFilter={activeFilter} onFilterChange={setActiveFilter}>
        {loading ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Veranstaltungen …</div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Keine Veranstaltungen im ausgewählten Status.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((event) => (
              <article key={event.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">{event.title ?? 'Ohne Titel'}</h2>
                    <p className="text-sm text-gray-600">{event.subtitle}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm', { locale: de })}
                      {event.endDate ? ` – ${format(new Date(event.endDate), 'dd.MM.yyyy HH:mm', { locale: de })}` : ''}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Eingereicht durch {event.organizer?.name ?? 'Unbekannt'} am{' '}
                      {format(new Date(event.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </p>
                    <div className="text-sm text-gray-700 whitespace-pre-line">{event.description}</div>
                    {Array.isArray(event.tags) && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {event.tags.map((tag) => (
                          <span key={typeof tag === 'object' ? tag.id : tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {typeof tag === 'object' ? tag.name : tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 text-sm">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status anpassen</label>
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                      value={event.status ?? 'pending'}
                      onChange={(evt) => handleDecision(event.id, evt.target.value)}
                      disabled={processingId === event.id}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <a
                      href={`/event/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                    >
                      Öffnen
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </EditorLayout>
    </div>
  );
};

export default EditorEventsPage;
