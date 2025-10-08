import React, { useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';

const OrganizerMediaPage = () => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sortedMedia = useMemo(
    () => media.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [media],
  );

  useEffect(() => {
    let mounted = true;

    const loadMedia = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          'where[owner][equals]': user.id,
          sort: '-createdAt',
          limit: '200',
          depth: '0',
        });
        const response = await fetch(buildApiUrl(`/api/media?${params.toString()}`), {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Medien konnten nicht geladen werden');
        }

        const data = await response.json();
        if (mounted) {
          setMedia(Array.isArray(data.docs) ? data.docs : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMedia();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || !altText.trim()) {
      setError('Bitte wähle eine Datei aus und gib einen Alt-Text an.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', altText.trim());

    try {
      const response = await fetch(buildApiUrl('/api/media'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen');
      }

      const created = await response.json();
      setMedia((prev) => [created, ...prev]);
      setFile(null);
      setAltText('');
      setMessage('Bild wurde hochgeladen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bild wirklich löschen?')) return;
    try {
      const response = await fetch(buildApiUrl(`/api/media/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen');
      }
      setMedia((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Medien</p>
        <h1 className="text-3xl font-bold text-gray-900">Event-Bilder verwalten</h1>
        <p className="text-sm text-gray-600">
          Lade neue Bilder hoch und lösche nicht mehr benötigte Dateien. Achte darauf, aussagekräftige Alt-Texte zu vergeben.
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Neues Bild hochladen</h2>
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>
        )}

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Bilddatei
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Alt-Text (Beschreibung)
            <input
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Was ist auf dem Bild zu sehen?"
              required
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? 'Lade hoch …' : 'Bild hochladen'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Meine Bilder</h2>
          <span className="text-sm text-gray-500">{sortedMedia.length} Dateien</span>
        </div>

        {loading ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Medien …</div>
        ) : sortedMedia.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Noch keine Bilder hochgeladen. Nutze das Formular oben, um loszulegen.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedMedia.map((item) => (
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
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-gray-500">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#417225] hover:underline">
                      Anzeigen
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-md border border-transparent px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizerMediaPage;
