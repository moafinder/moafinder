import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createLocation } from '../../api/locations';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';

const EditorPlaceCreatePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    description: '',
    image: '',
    address: { street: '', number: '', postalCode: '', city: 'Berlin' },
    openingHours: '',
  });
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
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
    loadMedia();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (path, value) => {
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
      await createLocation(form);
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
          <Field label="Kurzform des Ortsnamens" required value={form.shortName} onChange={(v) => handleChange('shortName', v)} />
        </div>
        <Textarea label="Beschreibung (max. 1000 Zeichen)" rows={4} value={form.description} onChange={(v) => handleChange('description', v)} />

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

const Field = ({ label, value, onChange, required }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const Textarea = ({ label, value, onChange, rows = 4 }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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

