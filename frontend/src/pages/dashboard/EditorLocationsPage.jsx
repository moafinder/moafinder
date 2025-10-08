import React, { useEffect, useMemo, useState } from 'react';
import { listLocations } from '../../api/locations';

const EditorLocationsPage = () => {
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
        const data = await listLocations({ limit: 500 });
        if (mounted) setLocations(Array.isArray(data.docs) ? data.docs : []);
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
    return locations.filter((loc) => {
      const haystack = `${loc.name ?? ''} ${loc.shortName ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [locations, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Veranstaltungsorte</h1>
        <p className="text-sm text-gray-600">
          Überblick über alle Orte im MoaFinder. Bearbeite Details im Payload-Backend.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">{locations.length} Orte im Verzeichnis</div>
        <input
          type="search"
          placeholder="Ort suchen …"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-64"
        />
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Orte …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((location) => (
            <article key={location.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{location.name}</h2>
              <p className="text-sm text-gray-600">{location.shortName}</p>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{location.description ?? 'Keine Beschreibung hinterlegt.'}</p>
              {location.address && (
                <p className="mt-2 text-sm text-gray-600">
                  {location.address.street} {location.address.number}, {location.address.postalCode} {location.address.city}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorLocationsPage;
