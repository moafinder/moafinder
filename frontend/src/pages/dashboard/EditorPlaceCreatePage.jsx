import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createLocation } from '../../api/locations';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import { useAuth } from '../../context/AuthContext';
import { listMyOrganizations, listAllOrganizations } from '../../api/organizations';
import { HelpSection } from '../../components/HelpTooltip';
import ImageUpload from '../../components/ImageUpload';
import { isWithinMoabitBounds } from '../../components/MapView';

const EditorPlaceCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    description: '',
    image: '',
    address: { street: '', number: '', supplement: '', postalCode: '', city: 'Berlin' },
    mapPosition: { x: '', y: '' },
    coordinates: { lat: '', lon: '' },
    openingHours: '',
    organizations: [], // Changed from owner to organizations (array)
  });
  const [media, setMedia] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [noOrgsWarning, setNoOrgsWarning] = useState(false);

  useEffect(() => {
    let mounted = true;
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
      setNoOrgsWarning(false);
      try {
        // Admin sees all orgs, others see only their own
        const data = user?.role === 'admin' 
          ? await listAllOrganizations({ limit: 200 })
          : await listMyOrganizations();
        const orgs = Array.isArray(data?.docs) ? data.docs : [];
        if (mounted) {
          setOrganizations(orgs);
          // If non-admin has no orgs, show warning
          if (user?.role !== 'admin' && orgs.length === 0) {
            setNoOrgsWarning(true);
          }
          // If non-admin has exactly one org, preselect it
          if (user?.role !== 'admin' && orgs.length === 1) {
            setForm((prev) => ({ ...prev, organizations: [orgs[0].id] }));
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
    loadMedia();
    loadOrganizations();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleChange = (path, value) => {
    if (path.startsWith('address.')) {
      const key = path.split('.')[1];
      setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
      return;
    }
    if (path.startsWith('mapPosition.')) {
      const key = path.split('.')[1];
      setForm((prev) => ({ ...prev, mapPosition: { ...prev.mapPosition, [key]: value } }));
      return;
    }
    if (path.startsWith('coordinates.')) {
      const key = path.split('.')[1];
      setForm((prev) => ({ ...prev, coordinates: { ...prev.coordinates, [key]: value } }));
      return;
    }
    setForm((prev) => ({ ...prev, [path]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      // Build payload according to backend expectation
      const payload = {
        name: form.name,
        shortName: form.shortName,
        description: form.description || undefined,
        image: form.image || undefined,
        address: {
          street: form.address.street,
          number: form.address.number,
          supplement: form.address.supplement || undefined,
          postalCode: form.address.postalCode,
          city: form.address.city || 'Berlin',
        },
        openingHours: form.openingHours || undefined,
      };
      
      // Set organizations (required field)
      if (form.organizations && form.organizations.length > 0) {
        payload.organizations = form.organizations;
      } else if (organizations.length === 1) {
        // Auto-assign the only available org
        payload.organizations = [organizations[0].id];
      }

      const x = String(form.mapPosition.x).trim();
      const y = String(form.mapPosition.y).trim();
      if (x !== '' || y !== '') {
        const nx = x === '' ? undefined : Number(x);
        const ny = y === '' ? undefined : Number(y);
        payload.mapPosition = { x: nx, y: ny };
      }

      const latStr = String(form.coordinates.lat).trim();
      const lonStr = String(form.coordinates.lon).trim();
      if (latStr !== '' && lonStr !== '') {
        const lat = Number(latStr);
        const lon = Number(lonStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          // Payload stores coordinates as [lon, lat]
          payload.coordinates = [lon, lat];
        }
      }

      await createLocation(payload);
      navigate('/dashboard/editor/places', { replace: true, state: { message: 'Ort angelegt.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Neuer Veranstaltungsort</h1>
        <p className="text-sm text-gray-600">Lege einen neuen Ort an, der anschließend in der Karte und bei Veranstaltungen auswählbar ist.</p>
      </header>

      {/* Help section explaining location creation */}
      <HelpSection title="Wie funktioniert die Orterstellung?">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Was ist ein Veranstaltungsort?</strong>
            <p className="mt-1">Orte sind Adressen, an denen Veranstaltungen stattfinden können. Einmal angelegt, können sie für beliebig viele Veranstaltungen wiederverwendet werden.</p>
          </div>
          <div>
            <strong className="text-blue-800">Organisation(en) zuweisen:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Jeder Ort muss <strong>mindestens einer Organisation</strong> zugeordnet werden.</li>
              <li>Nur Mitglieder dieser Organisationen können den Ort für ihre Veranstaltungen nutzen.</li>
              <li>Ein Ort kann mehreren Organisationen gehören (z.B. gemeinsam genutzte Räume).</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Koordinaten (optional):</strong>
            <p className="mt-1">Die Kartenposition wird für die Anzeige auf der Moabit-Karte verwendet. Die Koordinaten (lat/lon) sind für externe Kartendienste gedacht.</p>
          </div>
          {user?.role === 'admin' && (
            <div className="mt-2 rounded bg-blue-100 p-2">
              <strong className="text-blue-800">Als Admin:</strong>
              <span className="ml-1">Du siehst alle Organisationen und kannst Orte für jede Organisation anlegen.</span>
            </div>
          )}
        </div>
      </HelpSection>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Warning when user has no organizations */}
      {noOrgsWarning && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Hinweis:</strong> Du gehörst noch keiner Organisation an. Orte können nur von Organisationsmitgliedern angelegt werden.
          Bitte wende dich an einen Administrator, um einer Organisation beizutreten.
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Voller Name des Ortes" required value={form.name} onChange={(v) => handleChange('name', v)} />
          <Field label="Kurzform des Ortsnamens" required value={form.shortName} onChange={(v) => handleChange('shortName', v)} maxLength={40} />
        </div>
        
        {/* Organization selection - required for locations */}
        <MultiSelect
          label="Organisationen"
          required
          value={form.organizations}
          onChange={(v) => handleChange('organizations', v)}
          placeholder={loadingOrgs ? 'Lade Organisationen …' : organizations.length ? 'Organisationen wählen' : 'Keine Organisationen verfügbar'}
          options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          disabled={noOrgsWarning || loadingOrgs}
          helpText="Der Ort wird diesen Organisationen zugeordnet. Nur Mitglieder können ihn verwalten."
        />
        
        <Textarea label="Beschreibung (max. 1000 Zeichen)" rows={4} value={form.description} onChange={(v) => handleChange('description', v)} maxLength={1000} />

        <ImageUpload
          label="Titelbild"
          value={form.image}
          onChange={(v) => handleChange('image', v)}
          organizations={organizations}
          selectedOrg={form.organizations[0] || ''}
          onOrgChange={(orgId) => {
            if (!form.organizations.includes(orgId)) {
              handleChange('organizations', [orgId, ...form.organizations]);
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
          </div>
          <Field 
            label="Adresszusatz (optional)" 
            value={form.address.supplement} 
            onChange={(v) => handleChange('address.supplement', v)} 
            placeholder="z.B. Hinterhaus, 2. OG, Raum 101"
          />
          <p className="text-xs text-gray-500">Zusätzliche Angaben zur Adresse, die nicht für die Koordinatensuche verwendet werden.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="PLZ" required value={form.address.postalCode} onChange={(v) => handleChange('address.postalCode', v)} />
            <Field label="Ort" required value={form.address.city} onChange={(v) => handleChange('address.city', v)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Position auf der Karte (optional)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="X Position (%)" type="number" min={0} max={100} step="0.1" value={form.mapPosition.x} onChange={(v) => handleChange('mapPosition.x', v)} />
            <Field label="Y Position (%)" type="number" min={0} max={100} step="0.1" value={form.mapPosition.y} onChange={(v) => handleChange('mapPosition.y', v)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Koordinaten (optional)</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Breitengrad (lat)" type="number" step="0.000001" value={form.coordinates.lat} onChange={(v) => handleChange('coordinates.lat', v)} />
            <Field label="Längengrad (lon)" type="number" step="0.000001" value={form.coordinates.lon} onChange={(v) => handleChange('coordinates.lon', v)} />
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
          {form.coordinates.lat && form.coordinates.lon && (
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

        <div className="flex items-center justify-end gap-3">
          <Link to="/dashboard/editor/places" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Abbrechen</Link>
          <button type="submit" disabled={saving} className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-70">
            {saving ? 'Speichert …' : 'Ort anlegen'}
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500">Fehlt ein Bild? Lade es unter <Link to="/dashboard/editor/media" className="text-[#7CB92C] hover:underline">Event‑Bilder</Link> hoch.</p>
    </div>
  );
};

const Field = ({ label, value, onChange, required, type = 'text', min, max, step, maxLength, placeholder }) => (
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
      placeholder={placeholder}
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

const MultiSelect = ({ label, value = [], onChange, options = [], placeholder, disabled, helpText, required }) => {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-col text-sm font-medium text-gray-700">
      <span>{label}{required && <span className="text-red-500 ml-1">*</span>}</span>
      {helpText && <span className="text-xs text-gray-500 mt-1">{helpText}</span>}
      {options.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{placeholder || 'Keine Optionen verfügbar'}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => toggle(opt.value)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-[#7CB92C] bg-[#E8F5D9] text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {active && <span className="mr-1">✓</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EditorPlaceCreatePage;
