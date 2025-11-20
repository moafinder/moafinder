import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createLocation } from '../../api/locations';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import { useAuth } from '../../context/AuthContext';

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
    owner: '',
  });
  const [media, setMedia] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      try {
        let qs = '';
        if (user?.role === 'admin') {
          qs = new URLSearchParams({ limit: '200', sort: 'name' }).toString();
        } else if (user?.id) {
          const params = new URLSearchParams();
          // include membership via user.organization and owned orgs
          if (user.organization) params.append('where[id][equals]', user.organization);
          params.append('or[0][owner][equals]', user.id);
          params.set('limit', '50');
          qs = params.toString();
        }
        const url = qs ? `/api/organizations?${qs}` : '/api/organizations?limit=0';
        const res = await fetch(buildApiUrl(url), { credentials: 'include', headers: withAuthHeaders() });
        const data = await res.json();
        const orgs = Array.isArray(data?.docs) ? data.docs : [];
        if (mounted) setOrganizations(orgs);
        // If non-admin has exactly one org, preselect
        if (mounted && user?.role !== 'admin' && orgs.length === 1) {
          setForm((prev) => ({ ...prev, owner: orgs[0].id }));
        }
      } catch {
        if (mounted) setOrganizations([]);
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
      if ((user?.role === 'admin' || organizations.length > 1) && form.owner) {
        payload.owner = form.owner;
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

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Voller Name des Ortes" required value={form.name} onChange={(v) => handleChange('name', v)} />
          <Field label="Kurzform des Ortsnamens" required value={form.shortName} onChange={(v) => handleChange('shortName', v)} maxLength={40} />
        </div>
        {(user?.role === 'admin' || organizations.length > 1) && (
          <Select
            label="Besitzende Organisation"
            value={form.owner}
            onChange={(v) => handleChange('owner', v)}
            placeholder={loadingOrgs ? 'Lade Organisationen …' : organizations.length ? 'Organisation wählen' : 'Keine Organisationen gefunden'}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
        )}
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

export default EditorPlaceCreatePage;
