import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { withAuthHeaders } from '../../utils/authHeaders';
import { listMyOrganizations, listAllOrganizations } from '../../api/organizations';
import { HelpSection } from '../../components/HelpTooltip';
import ImageUpload from '../../components/ImageUpload';

const OrganizerMediaPage = () => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [noOrgsWarning, setNoOrgsWarning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sortedMedia = useMemo(
    () => media.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [media],
  );

  const mediaBaseUrl = useMemo(() => {
    try {
      const apiUrl = new URL(buildApiUrl('/'));
      if (apiUrl.pathname.endsWith('/api/') || apiUrl.pathname.endsWith('/api')) {
        apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '/');
      }
      return apiUrl;
    } catch (error) {
      return null;
    }
  }, []);

  const resolveMediaUrl = useCallback(
    (rawUrl) => {
      if (!rawUrl) return null;
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
      if (!mediaBaseUrl) return rawUrl;
      return new URL(rawUrl.replace(/^\//, ''), mediaBaseUrl).toString();
    },
    [mediaBaseUrl],
  );

  const getMediaKey = useCallback((item) => item?.id ?? item?._id ?? item?.filename ?? item?.url ?? null, []);

  const [previewUrls, setPreviewUrls] = useState({});
  const previewUrlsRef = useRef(previewUrls);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const missingItems = sortedMedia.filter((item) => {
      const key = getMediaKey(item);
      if (!key) return false;
      if (previewUrls[key]) return false;
      const rawUrl = item.sizes?.thumbnail?.url || item.url || item.filename;
      return Boolean(rawUrl && resolveMediaUrl(rawUrl));
    });

    if (!missingItems.length) return undefined;

    const fetchPreviews = async () => {
      const entries = await Promise.all(
        missingItems.map(async (item) => {
          const key = getMediaKey(item);
          const rawUrl = item.sizes?.thumbnail?.url || item.url || item.filename;
          const absoluteUrl = resolveMediaUrl(rawUrl);
          if (!key || !absoluteUrl) return null;
          try {
            const response = await fetch(absoluteUrl, {
              credentials: 'include',
              headers: withAuthHeaders(),
            });
            if (!response.ok) return null;
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            return [key, objectUrl];
          } catch (err) {
            console.warn('Konnte Medienvorschau nicht laden', err);
            return null;
          }
        }),
      );

      if (cancelled) {
        entries.forEach((entry) => {
          if (entry && entry[1]) URL.revokeObjectURL(entry[1]);
        });
        return;
      }

      const validEntries = entries.filter((entry) => entry && entry[0] && entry[1]);
      if (validEntries.length) {
        setPreviewUrls((prev) => {
          const next = { ...prev };
          validEntries.forEach(([key, url]) => {
            if (!next[key]) {
              next[key] = url;
            } else {
              URL.revokeObjectURL(url);
            }
          });
          return next;
        });
      }
    };

    fetchPreviews();

    return () => {
      cancelled = true;
    };
  }, [sortedMedia, resolveMediaUrl, getMediaKey, previewUrls]);

  // Load organizations
  useEffect(() => {
    let mounted = true;
    async function loadOrganizations() {
      setLoadingOrgs(true);
      setNoOrgsWarning(false);
      try {
        const data = user?.role === 'admin'
          ? await listAllOrganizations({ limit: 200 })
          : await listMyOrganizations();
        const orgs = Array.isArray(data?.docs) ? data.docs : [];
        if (mounted) {
          setOrganizations(orgs);
          if (user?.role !== 'admin' && orgs.length === 0) {
            setNoOrgsWarning(true);
          }
          // Auto-select if only one org
          if (orgs.length === 1) {
            setSelectedOrg(orgs[0].id);
          }
        }
      } catch {
        if (mounted) {
          setOrganizations([]);
          if (user?.role !== 'admin') setNoOrgsWarning(true);
        }
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    }
    loadOrganizations();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadMedia = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        // Load media from user's organizations (or all for admin)
        const params = new URLSearchParams({
          sort: '-createdAt',
          limit: '200',
          depth: '1',
        });
        const response = await fetch(buildApiUrl(`/api/media?${params.toString()}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
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

  const handlePreview = async (item) => {
    setError('');
    const rawUrl = item.url || item.sizes?.original?.url || item.filename || '';
    const absoluteUrl = resolveMediaUrl(rawUrl);
    if (!absoluteUrl) {
      setError('Vorschau konnte nicht geöffnet werden.');
      return;
    }

    try {
      const response = await fetch(absoluteUrl, {
        credentials: 'include',
        headers: withAuthHeaders(),
      });

      if (!response.ok) {
        let message = 'Vorschau konnte nicht geladen werden.';
        try {
          const payload = await response.json();
          message = payload?.errors?.[0]?.message ?? payload?.message ?? message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vorschau konnte nicht geladen werden.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bild wirklich löschen?')) return;
    try {
      const response = await fetch(buildApiUrl(`/api/media/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: withAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen');
      }
      setMedia((prev) => prev.filter((item) => item.id !== id));
      setPreviewUrls((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        URL.revokeObjectURL(next[id]);
        delete next[id];
        return next;
      });
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

      {/* Help section explaining media management */}
      <HelpSection title="Wie funktioniert die Bildverwaltung?">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Bilder hochladen:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Jedes Bild muss einer <strong>Organisation zugeordnet</strong> werden.</li>
              <li>Nur Mitglieder dieser Organisation können das Bild für ihre Veranstaltungen verwenden.</li>
              <li>Der <strong>Alt-Text</strong> beschreibt das Bild für Screenreader und SEO – bitte aussagekräftig ausfüllen.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Wichtige Hinweise:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Unterstützte Formate: JPG, PNG, WebP, GIF</li>
              <li>Bilder werden automatisch in verschiedenen Größen gespeichert.</li>
              <li>Gelöschte Bilder können nicht wiederhergestellt werden.</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Neues Bild hochladen</h2>
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>
        )}
        
        {/* Warning when user has no organizations */}
        {noOrgsWarning && (
          <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <strong>Hinweis:</strong> Du gehörst noch keiner Organisation an. Bilder können nur von Organisationsmitgliedern hochgeladen werden.
            Bitte wende dich an einen Administrator, um einer Organisation beizutreten.
          </div>
        )}

        <div className="mt-4">
          <ImageUpload
            label="Bild hochladen"
            value=""
            onChange={() => {}}
            organizations={organizations}
            selectedOrg={selectedOrg}
            onOrgChange={setSelectedOrg}
            existingMedia={[]}
            showExistingPicker={false}
            showUpload={true}
            disabled={noOrgsWarning || loadingOrgs}
            aspectRatio="16/9"
            helpText="Lade ein neues Bild für deine Veranstaltungen hoch. Es wird automatisch deiner Medienbibliothek hinzugefügt."
            onUploadComplete={(newMedia) => {
              setMedia((prev) => [newMedia, ...prev]);
              setMessage('Bild wurde erfolgreich hochgeladen.');
            }}
          />
        </div>
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
            {sortedMedia.map((item, index) => {
              const cacheKey = getMediaKey(item) ?? `media-${index}`;
              const previewUrl = cacheKey ? previewUrls[cacheKey] : null;
              return (
                <article
                  key={cacheKey ?? `media-${index}`}
                  className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt={item.alt || ''} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-500">Keine Vorschau</div>
                  )}
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-sm font-semibold text-gray-800">{item.alt || 'Ohne Beschreibung'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Hochgeladen am {item.createdAt ? new Date(item.createdAt).toLocaleDateString('de-DE') : '—'}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => handlePreview(item)}
                      className="font-semibold text-[#417225] hover:underline"
                    >
                      Anzeigen
                    </button>
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizerMediaPage;
