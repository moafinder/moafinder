import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import ListCard from './components/ListCard';
import { getListColor } from '../../utils/colorPalette';

const statusMeta = {
  draft: { label: 'Entwurf', tone: 'text-gray-600' },
  pending: { label: 'In Prüfung', tone: 'text-yellow-700' },
  approved: { label: 'Freigegeben', tone: 'text-[#417225]' },
  rejected: { label: 'Abgelehnt', tone: 'text-red-600' },
  archived: { label: 'Archiviert', tone: 'text-gray-500' },
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
          depth: '1',
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

  const formatSpan = (start, end) => {
    if (!start) return 'Termin folgt';
    try {
      const startDate = new Date(start);
      const base = format(startDate, 'dd.MM.yyyy / HH:mm', { locale: de });
      if (!end) return `${base} Uhr`;
      const endDate = new Date(end);
      return `${base}–${format(endDate, 'HH:mm', { locale: de })} Uhr`;
    } catch (err) {
      return start;
    }
  };

  const formatMeta = (value) => {
    if (!value) return 'Datum unbekannt';
    try {
      return format(new Date(value), 'dd.MM.yyyy', { locale: de });
    } catch (err) {
      return value;
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Alle' },
    { value: 'pending', label: 'In Prüfung' },
    { value: 'approved', label: 'Freigegeben' },
    { value: 'draft', label: 'Entwürfe' },
    { value: 'rejected', label: 'Abgelehnt' },
  ];

  const isNew = (event) => {
    const created = event.createdAt ? new Date(event.createdAt) : null;
    if (!created) return false;
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return diff < 1000 * 60 * 60 * 24 * 7;
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Angebote/Veranstaltungen</p>
            <h1 className="text-3xl font-bold text-gray-900">Einträge im MoaFinder</h1>
            <p className="text-sm text-gray-600">
              Reiche neue Angebote ein, prüfe den Status deiner Veranstaltungen und verwalte veröffentlichte Einträge.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/events/new')}
            className="inline-flex items-center justify-center rounded-md bg-[#7CB92C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#5a8b20]"
          >
            Neuer Event
          </button>
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
              {option.label} ({option.value === 'all' ? grouped.all.length : grouped.counts[option.value] ?? 0})
            </button>
          ))}
        </div>
        {flash && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">{flash}</div>
        )}
      </header>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Veranstaltungen …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Veranstaltungen im ausgewählten Status. Lege gleich einen neuen Event an oder wähle einen anderen Filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const meta = statusMeta[event.status] ?? statusMeta.draft;
            return (
              <ListCard
                key={event.id ?? index}
                color={getListColor(index)}
                tag={isNew(event) ? 'NEU' : null}
                title={event.title ?? 'Ohne Titel'}
                subtitle={`${formatSpan(event.startDate, event.endDate)} – ${event.location ?? 'Ort folgt'}`}
                meta={`Erstellt am ${formatMeta(event.createdAt)} von ${event.organizer?.name ?? 'Veranstalter*in'}`}
                actions={[
                  <Link
                    to={`/dashboard/events/${event.id}/edit`}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                  >
                    Bearbeiten
                  </Link>,
                  <a
                    href={`/event/${event.id}`}
                    className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20]"
                  >
                    Vorschau
                  </a>,
                ]}
              >
                <p className={`text-sm font-semibold ${meta.tone}`}>{meta.label}</p>
                {event.description && (
                  <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                )}
              </ListCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizerEventsPage;
