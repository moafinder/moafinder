import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { listEvents, updateEvent } from '../../api/events';
import ListCard from './components/ListCard';
import { getListColor } from '../../utils/colorPalette';

const statusOptions = [
  { value: 'pending', label: 'In Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
  { value: 'draft', label: 'Entwurf' },
];

const statusTone = {
  pending: 'text-yellow-700',
  approved: 'text-[#417225]',
  rejected: 'text-red-600',
  archived: 'text-gray-500',
  draft: 'text-gray-600',
};

const filterOptions = [
  { value: 'pending', label: 'Zur Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
  { value: 'draft', label: 'Entwürfe' },
  { value: 'all', label: 'Alle' },
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
    const initial = filterOptions.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {});
    return events.reduce((acc, event) => {
      const status = event.status ?? 'pending';
      acc[status] = (acc[status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, initial);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter((event) => (event.status ?? 'pending') === activeFilter);
  }, [events, activeFilter]);

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

  const formatDateTime = (value) => {
    if (!value) return 'Datum folgt';
    try {
      return format(new Date(value), 'dd.MM.yyyy / HH:mm', { locale: de });
    } catch (err) {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
          <h1 className="text-3xl font-bold text-gray-900">Einträge im MoaFinder</h1>
          <p className="text-sm text-gray-600">
            Entscheide über neue Veranstaltungen, pflege bestehende Angebote und halte das Archiv aktuell.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              className={`rounded-full border px-4 py-1 text-sm font-semibold transition ${
                activeFilter === option.value
                  ? 'border-[#7CB92C] bg-[#F0F8E8] text-[#417225]'
                  : 'border-gray-200 text-gray-700 hover:border-[#7CB92C] hover:text-[#417225]'
              }`}
            >
              {option.label} ({counts[option.value] ?? 0})
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Veranstaltungen …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Veranstaltungen in diesem Status.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const status = event.status ?? 'pending';
            const tone = statusTone[status] ?? statusTone.draft;
            return (
              <ListCard
                key={event.id ?? index}
                color={getListColor(index)}
                tag={status === 'pending' ? 'NEU' : null}
                title={event.title ?? 'Ohne Titel'}
                subtitle={`${formatDateTime(event.startDate)}${event.endDate ? ` – ${formatDateTime(event.endDate)}` : ''} · ${
                  event.location ?? 'Ort folgt'
                }`}
                meta={`Eingereicht am ${
                  event.createdAt ? format(new Date(event.createdAt), 'dd.MM.yyyy', { locale: de }) : 'unbekannt'
                } von ${event.organizer?.name ?? 'Unbekannt'}`}
                actions={[
                  <select
                    key="status"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-48"
                    value={status}
                    onChange={(evt) => handleDecision(event.id, evt.target.value)}
                    disabled={processingId === event.id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  <a
                    key="preview"
                    href={`/event/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                  >
                    Öffnen
                  </a>,
                ]}
              >
                <p className={`text-sm font-semibold ${tone}`}>{statusOptions.find((item) => item.value === status)?.label}</p>
                {event.description && (
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{event.description}</p>
                )}
                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={typeof tag === 'object' ? tag.id : tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                      >
                        {typeof tag === 'object' ? tag.name : tag}
                      </span>
                    ))}
                  </div>
                )}
              </ListCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EditorEventsPage;
