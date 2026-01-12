import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getLocation, updateLocation, deleteLocation } from '../../api/locations';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import ImageUpload from '../../components/ImageUpload';
import { isWithinMoabitBounds } from '../../components/MapView';

const EditorPlaceEditPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [media, setMedia] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const doc = await getLocation(id);
        if (!doc) throw new Error('Ort nicht gefunden.');
        if (mounted) {
          // Normalize API shape to local form structure
          const coords = Array.isArray(doc.coordinates) ? doc.coordinates : [];
          // Extract organization IDs from the document
          const orgIds = Array.isArray(doc.organizations)
            ? doc.organizations.map((org) => (typeof org === 'object' && org?.id) ? org.id : org).filter(Boolean)
            : [];
          setForm({
            name: doc.name || '',
            shortName: doc.shortName || '',
            description: doc.description || '',
            image: (typeof doc.image === 'object' && doc.image?.id) ? doc.image.id : (doc.image || ''),
            address: {
              street: doc.address?.street || '',
              number: doc.address?.number || '',
              postalCode: doc.address?.postalCode || '',
              city: doc.address?.city || 'Berlin',
            },
            mapPosition: { x: doc.mapPosition?.x ?? '', y: doc.mapPosition?.y ?? '' },
            coordinates: { lat: typeof coords[1] === 'number' ? coords[1] : '', lon: typeof coords[0] === 'number' ? coords[0] : '' },
            openingHours: doc.openingHours || '',
            organizations: orgIds,
          });
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Ort konnte nicht geladen werden.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    async function loadMedia() {
      setLoadingMedia(true);
      try {
        const res = await fetch(buildApiUrl('/api/media?limit=200'), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        const data = await res.json();
        if (mounted) setMedia(Array.isArray(data?.docs) ? data.docs : []);
      } catch {
        if (mounted) setMedia([]);
      } finally {
        if (mounted) setLoadingMedia(false);
      }
    }
    async function loadOrganizations() {
      setLoadingOrgs(true);
      try {
        // Load all organizations for display purposes (names in read-only view)
        // Admins can edit, others just see the list
        const qs = new URLSearchParams({ limit: '200', sort: 'name' }).toString();
        const url = `/api/organizations?${qs}`;
        const res = await fetch(buildApiUrl(url), { credentials: 'include', headers: withAuthHeaders() });
        const data = await res.json();
        if (mounted) setOrganizations(Array.isArray(data?.docs) ? data.docs : []);
      } catch {
        if (mounted) setOrganizations([]);
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    }
    load();
    loadMedia();
    loadOrganizations();
    return () => {
      mounted = false;
    };
  }, [id, user]);

  const handleChange = (path, value) => {
    if (!form) return;
    if (path.startsWith('address.')) {
      const key = path.split('.')[1];
      setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
      return;
    }
    setForm((prev) => ({ ...prev, [path]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form) return;
    if (!form.name || !form.shortName) {
      setError('Bitte Name und Kurzname angeben.');
      return;
    }
    if (!form.address.street || !form.address.number || !form.address.postalCode || !form.address.city) {
      setError('Bitte vollständige Adresse angeben.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        shortName: form.shortName,
        description: form.description || undefined,
        image: form.image || undefined,
        address: {
          street: form.address.street,
          number: form.address.number,
          postalCode: form.address.postalCode,
          city: form.address.city || 'Berlin',
        },
        openingHours: form.openingHours || undefined,
      };

      const x = String(form.mapPosition?.x ?? '').trim();
      const y = String(form.mapPosition?.y ?? '').trim();
      if (x !== '' || y !== '') {
        const nx = x === '' ? undefined : Number(x);
        const ny = y === '' ? undefined : Number(y);
        payload.mapPosition = { x: nx, y: ny };
      }

      const latStr = String(form.coordinates?.lat ?? '').trim();
      const lonStr = String(form.coordinates?.lon ?? '').trim();
      if (latStr !== '' && lonStr !== '') {
        const lat = Number(latStr);
        const lon = Number(lonStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) payload.coordinates = [lon, lat];
      }

      // Admin can update organizations, send as array
      if (user?.role === 'admin' && form.organizations && form.organizations.length > 0) {
        payload.organizations = form.organizations;
      }
      await updateLocation(id, payload);
      navigate('/dashboard/editor/places', { replace: true, state: { message: 'Ort aktualisiert.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const myOrgIds = (organizations || []).map((o) => o.id);
  const formOrgIds = form?.organizations || [];
  const hasMatchingOrg = formOrgIds.some((orgId) => myOrgIds.includes(orgId));
  const canDelete = user?.role === 'admin' || hasMatchingOrg;

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm('Ort wirklich löschen?')) return;
    try {
      await deleteLocation(id);
      navigate('/dashboard/editor/places', { replace: true, state: { message: 'Ort gelöscht.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
    }
  };

  if (loading) {
    return <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Ort …</div>;
  }

  if (!form) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Ort nicht gefunden.'}</div>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Veranstaltungsort bearbeiten</h1>
        <p className="text-sm text-gray-600">Passe die Angaben des Ortes an und speichere deine Änderungen.</p>
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Voller Name des Ortes" required value={form.name} onChange={(v) => handleChange('name', v)} />
          <Field label="Kurzform des Ortsnamens" required value={form.shortName} onChange={(v) => handleChange('shortName', v)} maxLength={40} />
        </div>
        
        {/* Organization assignment - editable for admin, read-only for others */}
        {user?.role === 'admin' ? (
          <MultiSelect
            label="Organisationen (welche Orgs können diesen Ort nutzen)"
            selectedValues={form.organizations || []}
            onChange={(values) => handleChange('organizations', values)}
            placeholder={loadingOrgs ? 'Lade Organisationen …' : 'Organisationen wählen'}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Zugeordnete Organisationen</p>
            {loadingOrgs ? (
              <p className="text-sm text-gray-500">Lade…</p>
            ) : form.organizations && form.organizations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.organizations.map((orgId) => {
                  const org = organizations.find((o) => o.id === orgId);
                  return (
                    <span
                      key={orgId}
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {org?.name || orgId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Keine Organisation zugeordnet</p>
            )}
            <p className="text-xs text-gray-500">Nur Admins können die Organisationszuordnung ändern.</p>
          </div>
        )}

        <Textarea label="Beschreibung (max. 1000 Zeichen)" rows={4} value={form.description} onChange={(v) => handleChange('description', v)} maxLength={1000} />

        <ImageUpload
          label="Titelbild"
          value={form.image}
          onChange={(v) => handleChange('image', v)}
          organizations={organizations}
          selectedOrg={form.organizations?.[0] || ''}
          onOrgChange={(orgId) => {
            // When org changes for image upload, ensure it's in the organizations array
            const currentOrgs = form.organizations || [];
            if (orgId && !currentOrgs.includes(orgId)) {
              handleChange('organizations', [orgId, ...currentOrgs]);
            }
          }}
          existingMedia={media}
          showExistingPicker={true}
          showUpload={true}
          aspectRatio="16/9"
          helpText="Wähle ein bestehendes Bild oder lade ein neues hoch. Das Bild wird als Titelbild des Ortes angezeigt."
          onUploadComplete={(newMedia) => {
            setMedia((prev) => [newMedia, ...prev]);
          }}
        />

        <Field label="Öffnungszeiten (optional)" value={form.openingHours} onChange={(v) => handleChange('openingHours', v)} />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Adresse</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Straße" required value={form.address.street} onChange={(v) => handleChange('address.street', v)} />
            <Field label="Hausnummer" required value={form.address.number} onChange={(v) => handleChange('address.number', v)} />
            <Field label="PLZ" required value={form.address.postalCode} onChange={(v) => handleChange('address.postalCode', v)} />
            <Field label="Ort" required value={form.address.city} onChange={(v) => handleChange('address.city', v)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Position auf der Karte (optional)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="X Position (%)" type="number" min={0} max={100} step="0.1" value={form.mapPosition?.x} onChange={(v) => handleChange('mapPosition.x', v)} />
            <Field label="Y Position (%)" type="number" min={0} max={100} step="0.1" value={form.mapPosition?.y} onChange={(v) => handleChange('mapPosition.y', v)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Koordinaten (optional)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Breitengrad (lat)" type="number" step="0.000001" value={form.coordinates?.lat} onChange={(v) => handleChange('coordinates.lat', v)} />
            <Field label="Längengrad (lon)" type="number" step="0.000001" value={form.coordinates?.lon} onChange={(v) => handleChange('coordinates.lon', v)} />
          </div>
          
          {/* Geocoding button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!form.address.street || !form.address.postalCode) {
                  setError('Bitte zuerst Straße und PLZ ausfüllen.');
                  return;
                }
                setGeocoding(true);
                setGeocodeResult(null);
                setError('');
                try {
                  const addressParts = [
                    form.address.street,
                    form.address.number,
                    form.address.postalCode,
                    form.address.city || 'Berlin',
                    'Germany'
                  ].filter(Boolean);
                  const query = encodeURIComponent(addressParts.join(', '));
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
                    { headers: { 'Accept-Language': 'de' } }
                  );
                  const data = await response.json();
                  if (data && data.length > 0) {
                    const { lat, lon, display_name } = data[0];
                    const parsedLat = parseFloat(lat);
                    const parsedLon = parseFloat(lon);
                    setGeocodeResult({ lat: parsedLat, lon: parsedLon, displayName: display_name });
                  } else {
                    setError('Adresse konnte nicht gefunden werden. Bitte Koordinaten manuell eingeben.');
                  }
                } catch (err) {
                  setError('Geocoding fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
                } finally {
                  setGeocoding(false);
                }
              }}
              disabled={geocoding || !form.address.street}
              className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {geocoding ? 'Suche läuft…' : '📍 Koordinaten aus Adresse ermitteln'}
            </button>
            {geocodeResult && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Gefunden: {geocodeResult.lat.toFixed(6)}, {geocodeResult.lon.toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      coordinates: { lat: geocodeResult.lat, lon: geocodeResult.lon }
                    }));
                    setGeocodeResult(null);
                  }}
                  className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Übernehmen
                </button>
                <button
                  type="button"
                  onClick={() => setGeocodeResult(null)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Verwerfen
                </button>
              </div>
            )}
          </div>
          
          {/* Coordinate validation warning */}
          {form.coordinates?.lat && form.coordinates?.lon && (
            (() => {
              const lat = parseFloat(form.coordinates.lat);
              const lon = parseFloat(form.coordinates.lon);
              if (!isNaN(lat) && !isNaN(lon)) {
                if (!isWithinMoabitBounds(lat, lon)) {
                  return (
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800">
                      ⚠️ Die Koordinaten liegen außerhalb des Moabit-Kartenbereichs. Der Ort wird am Rand der Karte angezeigt oder ist nicht sichtbar.
                    </div>
                  );
                }
              }
              return null;
            })()
          )}
          
          <p className="text-xs text-gray-500">Hinweis: Im Backend werden Koordinaten als [lon, lat] gespeichert. Die Koordinaten werden für die Kartenanzeige verwendet.</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Ort löschen
            </button>
          )}
          <Link to="/dashboard/editor/places" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Abbrechen</Link>
          <button type="submit" disabled={saving} className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-70">
            {saving ? 'Speichert …' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500">Weitere Optionen im <a href={buildApiUrl('/admin/collections/locations')} className="text-[#7CB92C] hover:underline" target="_blank" rel="noopener noreferrer">Admin‑Bereich</a>.</p>
    </div>
  );
};

const Field = ({ label, value, onChange, required, type = 'text', min, max, step, maxLength }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      min={min}
      max={max}
      step={step}
      maxLength={maxLength}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const Textarea = ({ label, value, onChange, rows = 4, maxLength }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const Select = ({ label, value, onChange, options = [], placeholder }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    >
      <option value="">{placeholder || 'Bitte auswählen'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </label>
);

const MultiSelect = ({ label, selectedValues = [], onChange, options = [], placeholder }) => {
  const handleCheckboxChange = (value, checked) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="flex flex-col text-sm font-medium text-gray-700">
      <span className="mb-2">{label}</span>
      {options.length === 0 ? (
        <p className="text-gray-500 italic">{placeholder || 'Keine Optionen verfügbar'}</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={(e) => handleCheckboxChange(opt.value, e.target.checked)}
                className="rounded border-gray-300 text-[#7CB92C] focus:ring-[#7CB92C]"
              />
              <span className="text-gray-900">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
      {selectedValues.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">{selectedValues.length} Organisation(en) ausgewählt</p>
      )}
    </div>
  );
};

export default EditorPlaceEditPage;
