import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const statusLabels = {
  draft: 'Entwurf',
  pending: 'In Prüfung',
  approved: 'Veröffentlicht',
  archived: 'Archiviert',
  rejected: 'Abgelehnt',
};

const badgeClasses = {
  draft: 'bg-gray-200 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-700',
};

const formatDate = (value, includeTime = false) => {
  if (!value) return '–';
  try {
    return format(new Date(value), includeTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy', { locale: de });
  } catch (err) {
    return value;
  }
};

const OrganizerEventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [flash, setFlash] = useState(location.state?.message ?? '');

  useEffect(() => {
    if (location.state?.message) {
      const timer = setTimeout(() => setFlash(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.message]);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.message, location.pathname, navigate]);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      if (!user) return;
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          'where[organizer][equals]': user.id,
          sort: '-createdAt',
          depth: '0',
          limit: '200',
        });
        const response = await fetch(buildApiUrl(`/api/events?${params.toString()}`), {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Veranstaltungen konnten nicht geladen werden');
        }

        const data = await response.json();
        if (mounted) {
          setEvents(Array.isArray(data.docs) ? data.docs : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [user]);

  const grouped = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const status = event.status ?? 'draft';
        acc.counts[status] = (acc.counts[status] || 0) + 1;
        acc.all.push(event);
        return acc;
      },
      { counts: {}, all: [] },
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return grouped.all;
    return grouped.all.filter((event) => event.status === activeFilter);
  }, [grouped, activeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Veranstaltungen</p>
          <h1 className="text-3xl font-bold text-gray-900">Meine Events</h1>
          <p className="text-sm text-gray-600">Verwalte Entwürfe, eingereichte Events und veröffentlichte Angebote.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/events/new')}
          className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20]"
        >
          Neue Veranstaltung einreichen
        </button>
      </div>

      {flash && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">{flash}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Alle" value={grouped.all.length} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
        {Object.entries(grouped.counts).map(([status, value]) => (
          <StatPill
            key={status}
            label={statusLabels[status] ?? status}
            value={value}
            active={activeFilter === status}
            onClick={() => setActiveFilter(status)}
          />
        ))}
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Veranstaltungen …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Veranstaltungen im ausgewählten Status. Reiche eine neue ein oder ändere den Filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Start</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Bearbeitet</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex flex-col">
                      <span>{event.title ?? 'Ohne Titel'}</span>
                      <span className="text-xs text-gray-500">{event.location ?? 'Ort folgt'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDate(event.startDate)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        badgeClasses[event.status] ?? 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {statusLabels[event.status] ?? event.status ?? 'Unbekannt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(event.updatedAt)}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/dashboard/events/${event.id}/edit`}
                        className="rounded-md border border-gray-300 px-3 py-1 font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                      >
                        Bearbeiten
                      </Link>
                      <a
                        href={`/event/${event.id}`}
                        className="rounded-md bg-[#7CB92C] px-3 py-1 font-semibold text-black transition hover:bg-[#5a8b20]"
                      >
                        Vorschau
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatPill = ({ label, value, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow ${
      active ? 'border-[#7CB92C] bg-[#F0F8E8]' : 'border-gray-200 bg-white'
    }`}
  >
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    <span className="text-2xl font-semibold text-gray-900">{value}</span>
  </button>
);

export default OrganizerEventsPage;
