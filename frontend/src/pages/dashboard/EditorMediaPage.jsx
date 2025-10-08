import React, { useEffect, useMemo, useState } from 'react';
import { listMedia, deleteMedia } from '../../api/media';

const EditorMediaPage = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listMedia({ limit: 200 });
        if (mounted) setMedia(Array.isArray(data.docs) ? data.docs : []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Medien konnten nicht geladen werden');
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
    if (!search) return media;
    return media.filter((item) => {
      const owner = typeof item.owner === 'object' ? item.owner.email ?? item.owner.name ?? '' : '';
      const haystack = `${item.alt ?? ''} ${owner}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [media, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bild wirklich löschen?')) return;
    try {
      setProcessingId(id);
      await deleteMedia(id);
      setMedia((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Event-Bilder verwalten</h1>
        <p className="text-sm text-gray-600">Überblick über alle hochgeladenen Medien. Lösche nicht mehr benötigte Dateien.</p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">{media.length} Dateien insgesamt</div>
        <input
          type="search"
          placeholder="Nach Alt-Text oder Besitzer suchen …"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-72"
        />
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Medien …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <article key={item.id} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {item.url ? (
                <img src={item.url} alt={item.alt || ''} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-500">Keine Vorschau</div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-sm font-semibold text-gray-800">{item.alt || 'Ohne Beschreibung'}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Hochgeladen am {new Date(item.createdAt).toLocaleDateString('de-DE')}
                  {item.owner && ` · ${typeof item.owner === 'object' ? item.owner.email ?? item.owner.name : ''}`}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-gray-500">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#417225] hover:underline">
                    Anzeigen
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={processingId === item.id}
                    className="rounded-md border border-transparent px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorMediaPage;
