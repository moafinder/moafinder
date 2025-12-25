import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLocations } from '../../api/locations';
import ListCard from './components/ListCard';
import { getListColor } from '../../utils/colorPalette';

const OrganizerLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listLocations({ limit: 500, sort: 'name' });
        if (mounted) {
          setLocations(Array.isArray(data.docs) ? data.docs : []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Orte konnten nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return locations;
    const term = search.toLowerCase();
    return locations.filter((location) =>
      `${location.name ?? ''} ${location.shortName ?? ''}`.toLowerCase().includes(term),
    );
  }, [locations, search]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Veranstaltungsorte</p>
        <h1 className="text-3xl font-bold text-gray-900">MoaFinder Veranstaltungsorte</h1>
        <p className="text-sm text-gray-600">
          Überblick über alle Orte, an denen Veranstaltungen stattfinden können. Nutze die Suche, um schnell den passenden
          Ort zu finden.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-gray-600">{locations.length} Orte im Verzeichnis</span>
        <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Ort suchen …"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-72"
        />
        <a href="/dashboard/places/new" className="rounded-md bg-[#7CB92C] px-3 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20]">Neuer Ort</a>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Orte …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Orte passen zur Suche.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((location, index) => (
            <ListCard
              key={location.id ?? index}
              color={getListColor(index)}
              title={location.name ?? 'Ohne Namen'}
              subtitle={location.shortName}
              meta={
                location.address
                  ? `${location.address.street ?? ''} ${location.address.number ?? ''}, ${
                      location.address.postalCode ?? ''
                    } ${location.address.city ?? ''}`
                  : null
              }
              actions={[
                <Link
                  key="edit"
                  to={`/dashboard/places/${location.id}/edit`}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bearbeiten
                </Link>
              ]}
            >
              {location.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{location.description}</p>
              )}
            </ListCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerLocationsPage;
