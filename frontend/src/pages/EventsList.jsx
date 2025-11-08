import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../api/events';
import { adaptEvent } from '../utils/dataAdapters';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await listEvents({ limit: 200, depth: 2, sort: 'startDate', 'where[status][equals]': 'approved' });
        const docs = Array.isArray(response?.docs) ? response.docs : [];
        const adapted = docs.map(adaptEvent).filter(Boolean);
        if (!cancelled) setEvents(adapted);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Einträge konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dateFmt = useMemo(() => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }), []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Einträge</h1>
        <Link to="/formate" className="text-[#7CB92C] hover:underline font-semibold">← Zur Startseite</Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="mt-4 text-gray-600">Einträge werden geladen …</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-gray-600">Keine Einträge gefunden.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="rounded border border-gray-200 bg-white p-4">
              <Link to={`/event/${ev.id}`} className="block hover:text-[#7CB92C]">
                <p className="text-sm text-gray-500">
                  {ev.startDateObj ? dateFmt.format(ev.startDateObj) : 'Datum folgt'}{ev.timeLabel ? ` · ${ev.timeLabel}` : ''}
                </p>
                <p className="text-lg font-semibold text-gray-800">{ev.title}</p>
                <p className="text-sm text-gray-700">{ev.location?.shortName ?? ev.location?.name ?? 'Ort folgt'}</p>
                {ev.excerpt && <p className="text-sm text-gray-600 mt-1">{ev.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
