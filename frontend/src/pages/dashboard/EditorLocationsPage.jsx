import React, { useEffect, useMemo, useState } from 'react';
import { listLocations, deleteLocation } from '../../api/locations';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';

const EditorLocationsPage = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
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
    const loadOrgs = async () => {
      try {
        if (!user?.id) return;
        const params = new URLSearchParams();
        if (user.role === 'admin') {
          params.set('limit', '200');
        } else {
          params.set('where[owner][equals]', user.id);
          params.set('limit', '50');
        }
        const res = await fetch(buildApiUrl(`/api/organizations?${params.toString()}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        const payload = await res.json();
        if (mounted) setOrganizations(Array.isArray(payload?.docs) ? payload.docs : []);
      } catch {
        if (mounted) setOrganizations([]);
      }
    };
    load();
    loadOrgs();
    return () => {
      mounted = false;
    };
  }, [user]);

  const filtered = useMemo(() => {
    if (!search) return locations;
    return locations.filter((loc) => {
      const haystack = `${loc.name ?? ''} ${loc.shortName ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [locations, search]);

  const handleDelete = async (id) => {
    const myOrgIds = organizations.map((o) => o.id);
    const target = locations.find((l) => l.id === id);
    const isOwner = target?.owner && myOrgIds.includes(typeof target.owner === 'object' ? target.owner.id : target.owner);
    if (!(user?.role === 'admin' || isOwner)) return;
    if (!window.confirm('Diesen Ort wirklich löschen?')) return;
    try {
      await deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    }
  };

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
        <div className="flex items-center gap-3">
          <input
          type="search"
          placeholder="Ort suchen …"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-64"
        />
          <a
            href="/dashboard/editor/places/new"
            className="rounded-md bg-[#7CB92C] px-3 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20]"
          >
            Neuer Ort
          </a>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Orte …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((location) => (
            <article key={location.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex-1 min-w-[12rem]">
                  <h2 className="text-lg font-semibold text-gray-900 break-words">{location.name}</h2>
                  <p className="text-sm text-gray-600 break-words">{location.shortName}</p>
                </div>
                {(() => {
                  const myOrgIds = organizations.map((o) => o.id)
                  const ownerId = typeof location.owner === 'object' ? location.owner?.id : location.owner
                  const isOwner = ownerId && myOrgIds.includes(ownerId)
                  const canEdit = user?.role === 'admin' || isOwner
                  return (
                    <div className="ml-auto flex flex-wrap items-start gap-2">
                      {canEdit && (
                        <a
                          href={`/dashboard/editor/places/${location.id}/edit`}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Bearbeiten
                        </a>
                      )}
                      {(user?.role === 'admin' || isOwner) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(location.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Löschen
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <a
                          href={`/admin/collections/locations/${location.id}`}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          target="_blank" rel="noopener noreferrer"
                        >
                          Im Admin öffnen
                        </a>
                      )}
                    </div>
                  )
                })()}
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line break-words">{location.description ?? 'Keine Beschreibung hinterlegt.'}</p>
              {location.address && (
                <p className="mt-2 text-sm text-gray-600 break-words">
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
