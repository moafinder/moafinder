import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createLocation } from '../../api/locations';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import { useAuth } from '../../context/AuthContext';
import { listMyOrganizations, listAllOrganizations } from '../../api/organizations';

const EditorPlaceCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    description: '',
    image: '',
    address: { street: '', number: '', postalCode: '', city: 'Berlin' },
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

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Titelbild"
            value={form.image}
            onChange={(v) => handleChange('image', v)}
            placeholder={loadingMedia ? 'Lade Medien …' : 'Bild auswählen'}
            options={media.map((m) => ({ value: m.id, label: m.alt || m.filename }))}
          />
          <Field label="Öffnungszeiten (optional)" value={form.openingHours} onChange={(v) => handleChange('openingHours', v)} />
        </div>

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
          <p className="text-xs text-gray-500">Hinweis: Im Backend werden Koordinaten als [lon, lat] gespeichert.</p>
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
