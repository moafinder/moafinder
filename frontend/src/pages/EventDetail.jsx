import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent } from '../api/events';
import { adaptEvent } from '../utils/dataAdapters';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          setError(err instanceof Error ? err.message : 'Veranstaltung konnte nicht geladen werden.');
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

      {event.image?.url && (
        <div className="w-full overflow-hidden rounded-lg shadow">
          <img
            src={event.image.url}
            alt={event.image.alt ?? event.title}
            className="h-72 w-full object-cover md:h-96"
          />
        </div>
      )}

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
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default EventDetail;
