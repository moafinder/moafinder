import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, listEvents } from '../api/events';
import { adaptEvent } from '../utils/dataAdapters';
import ImageWithFallback from '../components/ImageWithFallback';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) return () => {};

    const loadEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getEvent(id, { depth: 2 });
        const adapted = adaptEvent(response);
        if (!cancelled) {
          if (!adapted) {
            setError('Veranstaltung konnte nicht geladen werden.');
          } else {
            setEvent(adapted);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const raw = err instanceof Error ? err.message : String(err);
          let message = 'Veranstaltung konnte nicht geladen werden.';
          if (/not\s*found/i.test(raw)) {
            message = 'Diese Veranstaltung wurde nicht gefunden.';
          } else if (raw && raw.trim().startsWith('{')) {
            // Hide raw system JSON
            message = 'Ihre Anfrage konnte nicht verarbeitet werden.';
          } else if (raw && raw.length < 200) {
            message = raw;
          }
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load related events once the current event is available
  useEffect(() => {
    let cancelled = false;
    async function loadRelated() {
      if (!event) return;
      setLoadingRelated(true);
      try {
        const resp = await listEvents({
          limit: 100,
          depth: 2,
          sort: 'startDate',
          'where[status][equals]': 'approved',
        });
        const docs = Array.isArray(resp?.docs) ? resp.docs : [];
        const candidates = docs
          .map(adaptEvent)
          .filter(Boolean)
          .filter((e) => e.id !== event.id);

        // Score by same organizer, location, shared topic tags
        const orgId = event.organizer?.id ?? null;
        const locId = event.location?.id ?? null;
        const topicSet = new Set(event.topicTags || []);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const scored = candidates
          // Prefer upcoming or ongoing items
          .filter((e) => {
            if (e.endDateObj) return e.endDateObj >= todayStart;
            if (e.startDateObj) return e.startDateObj >= todayStart;
            return true;
          })
          .map((e) => {
            let score = 0;
            if (orgId && e.organizer?.id === orgId) score += 5;
            if (locId && e.location?.id === locId) score += 3;
            if (e.topicTags?.some((t) => topicSet.has(t))) score += 2;
            return { e, score };
          })
          .filter(({ score }) => score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const aDate = a.e.startDateObj || new Date(8640000000000000);
            const bDate = b.e.startDateObj || new Date(8640000000000000);
            return aDate - bDate;
          })
          .slice(0, 3)
          .map(({ e }) => e);

        if (!cancelled) setRelated(scored);
      } catch (_) {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }

    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [event]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const timeLabel = useMemo(() => {
    if (!event) return '';
    return event.timeLabel;
  }, [event]);

  const addressLines = useMemo(() => {
    if (!event?.location?.address) return [];
    return [event.location.address.line1, event.location.address.line2].filter(Boolean);
  }, [event]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Veranstaltung wird geladen …</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Veranstaltung nicht gefunden</h2>
        {error && <p className="text-gray-600 mb-4">{error}</p>}
        <Link to="/formate" className="text-[#7CB92C] hover:underline font-semibold">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const organizer = event.organizer;
  const topics = event.topicTags ?? [];
  const targets = event.targetTags ?? [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Link to="/formate" className="text-[#7CB92C] hover:underline font-semibold">
        ← Formate
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        {event.subtitle && (
          <p className="text-lg text-gray-700">{event.subtitle}</p>
        )}
        <div className="text-gray-600">
          <p className="font-semibold">
            {event.location?.name ?? event.location?.shortName ?? 'Ort folgt'}
            {event.location?.shortName && event.location?.name && (
              <span className="ml-2 text-sm text-gray-500">
                ({event.location.shortName})
              </span>
            )}
          </p>
          <p>
            {event.startDateObj ? dateFormatter.format(event.startDateObj) : 'Datum folgt'}
            {timeLabel && ` / ${timeLabel}`}
          </p>
          <p className="text-sm text-gray-500">{event.eventTypeLabel}</p>
          {event.recurrenceLabel && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Regelmäßiges Angebot</p>
                <p>{event.recurrenceLabel}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {targets.map((target) => (
            <span key={target} className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {target}
            </span>
          ))}
          {topics.map((topic) => (
            <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {topic}
            </span>
          ))}
          {event.costIsFree && (
            <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
              kostenlos
            </span>
          )}
          {event.isAccessible && (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              barrierefrei
            </span>
          )}
        </div>
      </header>

      <div className="w-full rounded-lg bg-gray-100 shadow overflow-hidden">
        <ImageWithFallback
          src={event.image?.url}
          alt={event.image?.alt ?? event.title}
          className="h-72 w-full md:h-96"
          showPlaceholderIndicator={!event.image?.url}
        />
      </div>

      <section className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2 space-y-6">
          {event.description && (
            <div className="prose max-w-none whitespace-pre-line text-gray-800">
              {event.description}
            </div>
          )}
          {event.cost?.details && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <h2 className="text-base font-semibold text-gray-900">Kosten</h2>
              <p>{event.cost.details}</p>
            </div>
          )}
          {event.registration?.required && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <h2 className="text-base font-semibold text-gray-900">Anmeldung</h2>
              {event.registration.details ? (
                <p>{event.registration.details}</p>
              ) : (
                <p>Anmeldung erforderlich.</p>
              )}
            </div>
          )}
        </article>

        <aside className="space-y-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-900">Ort</h2>
            <p className="mt-2 text-sm text-gray-700">
              {event.location?.name ?? 'Ort folgt'}
            </p>
            {event.location?.id && (
              <p className="text-sm mt-1">
                <Link to={`/place/${event.location.id}`} className="text-[#7CB92C] hover:underline font-semibold">Ortprofil ansehen</Link>
                <span className="text-gray-400"> · </span>
                <Link to="/orte" className="text-[#7CB92C] hover:underline">Karte öffnen</Link>
              </p>
            )}
            {addressLines.length > 0 ? (
              <address className="not-italic text-sm text-gray-600">
                {addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            ) : (
              <p className="text-sm text-gray-600">Adresse folgt.</p>
            )}
          </div>

          {organizer && (
            <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm text-gray-700">
              <h2 className="font-semibold text-gray-900">Angeboten von</h2>
              <p>{organizer.name}</p>
              {organizer.email && (
                <p>
                  <a
                    href={`mailto:${organizer.email}`}
                    className="text-[#7CB92C] hover:underline"
                  >
                    {organizer.email}
                  </a>
                </p>
              )}
              {organizer.phone && <p>{organizer.phone}</p>}
              {organizer.website && (
                <p>
                  <a
                    href={organizer.website.startsWith('http') ? organizer.website : `https://${organizer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7CB92C] hover:underline"
                  >
                    {organizer.website.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
              {organizer.email && (
                <a
                  href={`mailto:${organizer.email}?subject=Anfrage zu: ${event.title}`}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-[#7CB92C] text-white rounded-lg hover:bg-[#6aa825] transition-colors w-full justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Nachricht senden
                </a>
              )}
            </div>
          )}
        </aside>
      </section>

      {/* Related events */}
      {(loadingRelated || related.length > 0) && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Weitere Veranstaltungen</h2>
          {loadingRelated ? (
            <p className="text-gray-600">Ähnliche Veranstaltungen werden geladen …</p>
          ) : (
            <div className="space-y-2">
              {related.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/event/${ev.id}`}
                  className="block rounded-lg border border-gray-200 hover:border-gray-300 p-3"
                >
                  <p className="text-sm text-gray-600">
                    {ev.startDateObj ? dateFormatter.format(ev.startDateObj) : 'Datum folgt'}
                    {ev.timeLabel && ` / ${ev.timeLabel}`}
                  </p>
                  <h3 className="font-bold text-gray-800 mt-0.5">{ev.title}</h3>
                  <p className="text-sm text-gray-700">
                    {ev.location?.shortName ?? ev.location?.name ?? 'Ort folgt'}
                    {ev.organizer?.name && ` · ${ev.organizer.name}`}
                  </p>
                </Link>
              ))}
              {related.length === 0 && !loadingRelated && (
                <p className="text-gray-600">Keine ähnlichen Veranstaltungen gefunden.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EventDetail;
