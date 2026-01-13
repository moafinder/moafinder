import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLocation } from '../api/locations';
import { listEvents } from '../api/events';
import { adaptEvent, adaptLocation } from '../utils/dataAdapters';
import ImageWithFallback from '../components/ImageWithFallback';

/**
 * Detailed page for a specific place. Displays full information
 * including images, description, categories, location map and
 * additional content such as contact details or website links.
 */
const PlaceProfile = () => {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingPlace, setLoadingPlace] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [placeError, setPlaceError] = useState('');
  const [eventsError, setEventsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) return () => {};

    const loadPlace = async () => {
      setLoadingPlace(true);
      setPlaceError('');
      try {
        const response = await getLocation(id, { depth: 1 });
        if (!cancelled) {
          const adapted = adaptLocation(response);
          if (!adapted) {
            setPlaceError('Ort konnte nicht gefunden werden.');
          } else {
            setPlace(adapted);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPlaceError(err instanceof Error ? err.message : 'Ort konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPlace(false);
        }
      }
    };

    loadPlace();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return () => {};

    const loadEvents = async () => {
      setLoadingEvents(true);
      setEventsError('');
      try {
        const response = await listEvents({
          limit: 100,
          depth: 2,
          sort: 'startDate',
          'where[location][equals]': id,
          'where[status][equals]': 'approved',
        });
        const docs = Array.isArray(response?.docs) ? response.docs : [];
        if (!cancelled) {
          const adapted = docs.map(adaptEvent).filter(Boolean);
          setEvents(adapted);
        }
      } catch (err) {
        if (!cancelled) {
          setEventsError(err instanceof Error ? err.message : 'Veranstaltungen konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoadingEvents(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const addressLines = useMemo(() => {
    if (!place?.address) return [];
    return [place.address.line1, place.address.line2].filter(Boolean);
  }, [place]);

  if (loadingPlace) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Ort wird geladen …</p>
      </div>
    );
  }

  if (placeError || !place) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ort nicht gefunden</h2>
        {placeError && <p className="mb-4 text-gray-600">{placeError}</p>}
        <Link to="/orte" className="text-[#7CB92C] hover:underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  const eventDateFormatter = new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/orte" className="text-[#7CB92C] hover:underline">← Zurück zur Übersicht</Link>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg shadow overflow-hidden">
          <ImageWithFallback
            src={place.image?.url}
            alt={place.image?.alt ?? place.name}
            className="w-full h-64 md:h-80"
            showPlaceholderIndicator={!place.image?.url}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
          {place.shortName && place.shortName !== place.name && (
            <p className="text-sm uppercase tracking-wide text-gray-500">{place.shortName}</p>
          )}
          {place.description && <p className="text-gray-700 mb-4 whitespace-pre-line">{place.description}</p>}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Adresse</h2>
            {addressLines.length > 0 ? (
              addressLines.map((line) => <p key={line}>{line}</p>)
            ) : (
              <p className="text-gray-600">Adresse folgt.</p>
            )}
          </div>
          {place.openingHours && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Öffnungszeiten</h2>
              <p className="text-gray-700 whitespace-pre-line">{place.openingHours}</p>
            </div>
          )}
          {(place.email || place.homepage) && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Kontakt</h2>
              {place.email && (
                <p>
                  <a href={`mailto:${place.email}`} className="text-[#7CB92C] hover:underline">
                    {place.email}
                  </a>
                </p>
              )}
              {place.homepage && (
                <p>
                  <a
                    href={place.homepage.startsWith('http') ? place.homepage : `https://${place.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7CB92C] hover:underline"
                  >
                    {place.homepage.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
              {place.email && (
                <a
                  href={`mailto:${place.email}?subject=Anfrage über MoaFinder`}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-[#7CB92C] text-white rounded-lg hover:bg-[#6aa825] transition-colors"
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
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Veranstaltungen an diesem Ort</h2>
        {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}
        {loadingEvents ? (
          <p className="text-gray-600">Veranstaltungen werden geladen …</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600">Es sind aktuell keine Veranstaltungen veröffentlicht.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded border border-gray-200 bg-white p-4">
                <Link to={`/event/${event.id}`} className="block hover:text-[#7CB92C]">
                  <p className="text-sm text-gray-500">
                    {event.startDateObj ? eventDateFormatter.format(event.startDateObj) : 'Datum folgt'}
                    {event.timeLabel ? ` · ${event.timeLabel}` : ''}
                  </p>
                  <p className="text-lg font-semibold text-gray-800">{event.title}</p>
                  {event.organizer?.name && (
                    <p className="text-xs text-gray-500">von {event.organizer.name}</p>
                  )}
                  {event.excerpt && <p className="text-sm text-gray-600">{event.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaceProfile;
