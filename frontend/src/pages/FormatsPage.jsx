import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import headerGraphic from '../assets/header_grafik_klein.png';
import { listEvents } from '../api/events';
import { adaptEvent, buildEventFilterOptions } from '../utils/dataAdapters';
import ImageWithFallback from '../components/ImageWithFallback';

const initialFilters = {
  ageGroups: [],
  inclusion: false,
  free: false,
  eventType: 'all',
  themes: [],
  places: [],
  dates: [],
};

const FormatsPage = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await listEvents({
          limit: 200,
          depth: 2,
          sort: 'startDate',
          'where[status][equals]': 'approved',
        });
        const docs = Array.isArray(response?.docs) ? response.docs : [];
        const adapted = docs.map(adaptEvent).filter(Boolean);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const upcoming = adapted.filter((event) => {
          if (event.endDateObj) {
            return event.endDateObj >= todayStart;
          }
          if (event.startDateObj) {
            return event.startDateObj >= todayStart;
          }
          return true;
        });

        if (!cancelled) {
          setEvents(upcoming);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Veranstaltungen konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [],
  );

  const filterOptions = useMemo(() => buildEventFilterOptions(events), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.ageGroups?.length) {
        const hasGroup = event.targetTags?.some((tag) => filters.ageGroups.includes(tag));
        if (!hasGroup) return false;
      }

      if (filters.inclusion && !event.isAccessible) {
        return false;
      }

      if (filters.free && !event.costIsFree) {
        return false;
      }

      if (filters.eventType === 'einmalig' && event.eventType !== 'einmalig') {
        return false;
      }

      if (filters.eventType === 'regelmäßig' && event.eventType === 'einmalig') {
        return false;
      }

      if (filters.themes?.length) {
        const hasTheme = event.topicTags?.some((tag) => filters.themes.includes(tag));
        if (!hasTheme) return false;
      }

      if (filters.places?.length) {
        const placeName = event.location?.shortName ?? event.location?.name ?? '';
        const normalizedPlace = placeName.toLocaleLowerCase('de-DE');
        const matchesPlace = filters.places.some(
          (place) => place.toLocaleLowerCase('de-DE') === normalizedPlace,
        );
        if (!matchesPlace) return false;
      }

      if (filters.dates?.length) {
        if (!event.date || !filters.dates.includes(event.date)) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLocaleLowerCase('de-DE');
        const haystacks = [
          event.title,
          event.subtitle,
          event.excerpt,
          event.location?.shortName,
          event.location?.name,
          ...(event.topicTags ?? []),
          ...(event.targetTags ?? []),
        ];
        const matchesSearch = haystacks.some((value) =>
          value?.toLocaleLowerCase?.('de-DE').includes(query),
        );
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters, searchQuery]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const timeA = a.startDateObj?.getTime?.() ?? Number.POSITIVE_INFINITY;
      const timeB = b.startDateObj?.getTime?.() ?? Number.POSITIVE_INFINITY;
      return timeA - timeB;
    });
  }, [filteredEvents]);

  const newestEvents = useMemo(() => sortedEvents.slice(0, 4), [sortedEvents]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const todayEvents = useMemo(
    () => sortedEvents.filter((event) => event.date === todayKey),
    [sortedEvents, todayKey],
  );

  const renderEventCard = (event) => (
    <Link to={`/event/${event.id}`} key={event.id} className="block">
      <div className="flex border-b py-4 hover:bg-gray-50 transition-colors">
        <div className="w-1/5 h-24 md:h-28 flex-shrink-0 rounded overflow-hidden">
          <ImageWithFallback
            src={event.image?.url}
            alt={event.image?.alt ?? event.title}
            className="h-full w-full"
            showPlaceholderIndicator={!event.image?.url}
          />
        </div>
        <div className="w-4/5 pl-4">
          <p className="text-sm text-gray-600">
            {event.startDateObj ? dateFormatter.format(event.startDateObj) : 'Datum folgt'}
            {event.timeLabel && ` / ${event.timeLabel}`}
            &nbsp;&nbsp;
            {event.topicTags?.length > 0 && (
              <span className="font-semibold text-gray-800">
                {event.topicTags.join(', ')}
              </span>
            )}
            &nbsp;
            <span className="text-xs text-gray-500">{event.eventTypeLabel}</span>
          </p>
          <h3 className="font-bold text-gray-800 mt-1 mb-1">
            {event.location?.shortName ?? event.location?.name ?? 'Ort folgt'}
          </h3>
          <p className="text-sm font-semibold text-gray-800 mb-1">{event.title}</p>
          {event.organizer?.name && (
            <p className="text-xs text-gray-500 mb-1">von {event.organizer.name}</p>
          )}
          {event.excerpt && <p className="text-sm text-gray-600">{event.excerpt}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {event.targetTags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {event.costIsFree && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                kostenlos
              </span>
            )}
            {event.isAccessible && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                barrierefrei
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 text-center">
        <img
          src={headerGraphic}
          alt="MoaFinder Banner"
          className="mx-auto w-auto h-32 md:h-40 object-contain"
        />
        {/* Subtitle duplicated in the banner graphic; remove extra text line */}
      </div>

      <FilterBar
        onFilterChange={handleFilterChange}
        ageGroupOptions={filterOptions.ageGroups}
        themeOptions={filterOptions.themes}
        placeOptions={filterOptions.places}
        dateOptions={filterOptions.dates}
        disabled={loading || !!error || events.length === 0}
      />

      <div className="mt-6">
        <input
          type="text"
          placeholder="Suche nach Veranstaltungen, Orten oder Themen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center">
            <span className="text-green-600 mr-2">▶</span> SUCHERGEBNISSE
          </h2>
          <span className="text-sm text-gray-600">
            {filteredEvents.length} Veranstaltungen gefunden
          </span>
        </header>

        {loading ? (
          <p className="text-gray-600">Veranstaltungen werden geladen …</p>
        ) : sortedEvents.length === 0 ? (
          <p className="text-gray-600">
            Keine Veranstaltungen gefunden. Passe die Filter an oder versuche es später erneut.
          </p>
        ) : (
          <div className="space-y-6">
            {newestEvents.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="text-green-600 mr-2">▶</span> NEUESTE
                </h3>
                <div className="space-y-2">
                  {newestEvents.map(renderEventCard)}
                </div>
              </section>
            )}

            {todayEvents.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="text-green-600 mr-2">▶</span> HEUTE
                </h3>
                <div className="space-y-2">
                  {todayEvents.map(renderEventCard)}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <span className="text-green-600 mr-2">▶</span> ALLE VERANSTALTUNGEN
              </h3>
              <div className="space-y-2">
                {sortedEvents.map(renderEventCard)}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

export default FormatsPage;
