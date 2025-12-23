import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { withAuthHeaders } from '../../utils/authHeaders';
import { HelpSection } from '../../components/HelpTooltip';

const StatCard = ({ label, value, description }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
  </div>
);

const QuickActionCard = ({ title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#7CB92C] hover:shadow-md"
  >
    <span className="text-lg font-semibold text-gray-900">{title}</span>
    <span className="mt-2 text-sm text-gray-600">{description}</span>
  </button>
);

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          'where[organizer][equals]': user.id,
          depth: 0,
          sort: '-startDate',
          limit: 100,
        });
        const response = await fetch(buildApiUrl(`/api/events?${params.toString()}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Konnte Veranstaltungen nicht laden');
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

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const pending = events.filter((event) => event.status === 'pending').length;
    const drafts = events.filter((event) => event.status === 'draft').length;
    const published = events.filter((event) => event.status === 'approved').length;
    const upcoming = events
      .filter((event) => event.startDate && new Date(event.startDate) >= now)
      .slice(0, 4);

    return { pending, drafts, published, upcoming };
  }, [events]);

  const formatDate = (value) => {
    if (!value) return 'Datum folgt';
    try {
      return format(new Date(value), 'dd. MMM yyyy', { locale: de });
    } catch (err) {
      return value;
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Willkommen zurück</p>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Hier findest du einen Überblick über deine aktuellen Veranstaltungen, Entwürfe und anstehenden Aufgaben.
        </p>
      </header>

      {/* Getting started help for new users */}
      <HelpSection title="Erste Schritte im MoaFinder">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">So veröffentlichst du eine Veranstaltung:</strong>
            <ol className="mt-1 ml-4 list-decimal space-y-1">
              <li><strong>Organisation anlegen:</strong> Gehe zu "Profil der Organisation" und fülle deine Daten aus.</li>
              <li><strong>Freigabe abwarten:</strong> Die Redaktion prüft deine Organisation (meist innerhalb 1-2 Tagen).</li>
              <li><strong>Bilder hochladen:</strong> Unter "Event-Bilder" kannst du Bilder für deine Veranstaltungen hochladen.</li>
              <li><strong>Veranstaltung erstellen:</strong> Klicke auf "Neue Veranstaltung anlegen" und fülle das Formular aus.</li>
              <li><strong>Einreichen:</strong> Sende die Veranstaltung zur Prüfung – nach Freigabe ist sie öffentlich.</li>
            </ol>
          </div>
          <div>
            <strong className="text-blue-800">Status-Übersicht:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li><strong>Entwurf:</strong> Nur für dich sichtbar, noch nicht eingereicht.</li>
              <li><strong>Freigabe ausstehend:</strong> Eingereicht, wartet auf Prüfung durch Redaktion.</li>
              <li><strong>Aktiv:</strong> Freigegeben und öffentlich sichtbar im MoaFinder.</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Freigabe ausstehend" value={stats.pending} description="Veranstaltungen warten auf Prüfung." />
        <StatCard label="Aktiv" value={stats.published} description="Veröffentlichte Veranstaltungen." />
        <StatCard label="Entwürfe" value={stats.drafts} description="Noch nicht abgeschlossene Veranstaltungen." />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          title="Neue Veranstaltung anlegen"
          description="Reiche ein neues Angebot oder Event ein."
          onClick={() => navigate('/dashboard/events/new')}
        />
        <QuickActionCard
          title="Organisation aktualisieren"
          description="Passe deine Kontaktdaten und Beschreibung an."
          onClick={() => navigate('/dashboard/organization')}
        />
        <QuickActionCard
          title="Event-Bilder verwalten"
          description="Lade Medien hoch oder entferne alte Fotos."
          onClick={() => navigate('/dashboard/media')}
        />
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Bevorstehende Veranstaltungen</h2>
          <Link to="/dashboard/events" className="text-sm font-semibold text-[#417225] hover:underline">
            Alle ansehen
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-gray-500">Lade Veranstaltungen …</p>}
          {!loading && stats.upcoming.length === 0 && (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              Aktuell sind keine zukünftigen Veranstaltungen geplant. Leg gleich eine neue an!
            </p>
          )}

          {stats.upcoming.map((event) => (
            <div
              key={event.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 p-4 transition hover:border-[#7CB92C] md:flex-row md:items-center"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{formatDate(event.startDate)}</p>
                <h3 className="text-lg font-semibold text-gray-900">{event.title ?? 'Ohne Titel'}</h3>
                <p className="text-sm text-gray-600">
                  {event.place ?? 'Ort folgt'} · Status: {event.status ?? 'unbekannt'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <a
                  href={`/dashboard/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1 font-semibold text-gray-700 transition hover:border-[#7CB92C] hover:text-[#417225]"
                >
                  Bearbeiten
                </a>
                <a
                  href={`/event/${event.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-[#7CB92C] px-3 py-1 font-semibold text-black transition hover:bg-[#5a8b20]"
                >
                  Vorschau
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OrganizerDashboardPage;
