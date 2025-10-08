import React, { useEffect, useMemo, useState } from 'react';
import { listLocations } from '../../../api/locations';
import { listTags } from '../../../api/tags';
import { buildApiUrl } from '../../../api/baseUrl';
import { useAuth } from '../../../context/AuthContext';

const EVENT_TYPE_OPTIONS = [
  { label: 'Einmalig', value: 'einmalig' },
  { label: 'Täglich', value: 'täglich' },
  { label: 'Wöchentlich', value: 'wöchentlich' },
  { label: 'Monatlich', value: 'monatlich' },
  { label: 'Jährlich', value: 'jährlich' },
];

const WEEKDAY_OPTIONS = [
  { label: 'Montag', value: 'mon' },
  { label: 'Dienstag', value: 'tue' },
  { label: 'Mittwoch', value: 'wed' },
  { label: 'Donnerstag', value: 'thu' },
  { label: 'Freitag', value: 'fri' },
  { label: 'Samstag', value: 'sat' },
  { label: 'Sonntag', value: 'sun' },
];

const defaultForm = {
  title: '',
  subtitle: '',
  description: '',
  eventType: 'einmalig',
  startDate: '',
  endDate: '',
  timeFrom: '',
  timeTo: '',
  recurrenceDays: [],
  recurrenceUntil: '',
  location: '',
  tags: [],
  image: '',
  isAccessible: false,
  isFree: false,
  costDetails: '',
  registrationRequired: false,
  registrationDetails: '',
};

function isoToDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function datetimeLocalToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const OrganizerEventForm = ({ initialEvent = null, onSubmit }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [media, setMedia] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialEvent) {
      setForm(defaultForm);
      return;
    }
    setForm({
      title: initialEvent.title ?? '',
      subtitle: initialEvent.subtitle ?? '',
      description: initialEvent.description ?? '',
      eventType: initialEvent.eventType ?? 'einmalig',
      startDate: isoToDatetimeLocal(initialEvent.startDate),
      endDate: isoToDatetimeLocal(initialEvent.endDate),
      timeFrom: initialEvent.time?.from ?? '',
      timeTo: initialEvent.time?.to ?? '',
      recurrenceDays: initialEvent.recurrence?.daysOfWeek ?? [],
      recurrenceUntil: initialEvent.recurrence?.repeatUntil
        ? initialEvent.recurrence.repeatUntil.slice(0, 10)
        : '',
      location: initialEvent.location ?? '',
      tags: Array.isArray(initialEvent.tags)
        ? initialEvent.tags.map((tag) => (typeof tag === 'object' ? tag.id : tag))
        : [],
      image: typeof initialEvent.image === 'object' ? initialEvent.image.id : initialEvent.image ?? '',
      isAccessible: Boolean(initialEvent.isAccessible),
      isFree: Boolean(initialEvent.cost?.isFree),
      costDetails: initialEvent.cost?.details ?? '',
      registrationRequired: Boolean(initialEvent.registration?.required),
      registrationDetails: initialEvent.registration?.details ?? '',
    });
  }, [initialEvent]);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      setLoadingMeta(true);
      setError('');
      try {
        const [locationsRes, tagsRes, mediaRes] = await Promise.all([
          listLocations({ limit: 200 }),
          listTags({ limit: 200 }),
          fetch(buildApiUrl('/api/media?limit=200'), { credentials: 'include' }).then((response) => {
            if (!response.ok) {
              throw new Error('Medien konnten nicht geladen werden');
            }
            return response.json();
          }),
        ]);

        if (!mounted) return;
        setLocations(locationsRes.docs ?? []);
        setTags(tagsRes.docs ?? []);
        setMedia(mediaRes.docs ?? []);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden der Stammdaten');
        }
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field, values) => {
    setForm((prev) => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (status) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        eventType: form.eventType,
        startDate: datetimeLocalToIso(form.startDate),
        endDate: datetimeLocalToIso(form.endDate),
        recurrence:
          form.eventType === 'einmalig'
            ? null
            : {
                daysOfWeek: form.recurrenceDays,
                repeatUntil: form.recurrenceUntil || null,
              },
        time: {
          from: form.timeFrom,
          to: form.timeTo,
        },
        location: form.location || null,
        tags: form.tags,
        image: form.image || null,
        isAccessible: form.isAccessible,
        cost: {
          isFree: form.isFree,
          details: form.costDetails,
        },
        registration: {
          required: form.registrationRequired,
          details: form.registrationDetails,
        },
        status,
      };

      await onSubmit(payload, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
      return;
    } finally {
      setSaving(false);
    }
  };

  const recurrenceDisabled = form.eventType === 'einmalig';

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Basisinformationen</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="Titel"
            required
            value={form.title}
            onChange={(value) => handleChange('title', value)}
          />
          <Field
            label="Untertitel / Teaser"
            value={form.subtitle}
            onChange={(value) => handleChange('subtitle', value)}
          />
          <SelectField
            label="Art der Veranstaltung"
            value={form.eventType}
            onChange={(value) => handleChange('eventType', value)}
            options={EVENT_TYPE_OPTIONS}
          />
          <CheckboxField
            label="Barrierefrei"
            checked={form.isAccessible}
            onChange={(value) => handleChange('isAccessible', value)}
          />
        </div>
        <TextareaField
          label="Beschreibung"
          required
          rows={5}
          value={form.description}
          onChange={(value) => handleChange('description', value)}
        />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Termin & Wiederholung</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DatetimeField
            label="Startdatum"
            required
            value={form.startDate}
            onChange={(value) => handleChange('startDate', value)}
          />
          <DatetimeField
            label="Enddatum"
            value={form.endDate}
            onChange={(value) => handleChange('endDate', value)}
          />
          <Field
            label="Uhrzeit von"
            value={form.timeFrom}
            onChange={(value) => handleChange('timeFrom', value)}
          />
          <Field
            label="Uhrzeit bis"
            value={form.timeTo}
            onChange={(value) => handleChange('timeTo', value)}
          />
        </div>

        {!recurrenceDisabled && (
          <div className="mt-6 space-y-4 rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Wiederholung</p>
            <MultiSelectField
              label="Wochentage"
              value={form.recurrenceDays}
              onChange={(values) => handleMultiSelectChange('recurrenceDays', values)}
              options={WEEKDAY_OPTIONS}
            />
            <DateField
              label="Wiederholen bis"
              value={form.recurrenceUntil}
              onChange={(value) => handleChange('recurrenceUntil', value)}
            />
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Ort & Zuordnung</h2>
        {loadingMeta ? (
          <p className="text-sm text-gray-500">Lade Orte und Tags …</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Veranstaltungsort"
              value={form.location}
              onChange={(value) => handleChange('location', value)}
              placeholder="Ort auswählen"
              options={locations.map((location) => ({
                label: location.name,
                value: location.id,
              }))}
            />
            <MultiSelectField
              label="Tags"
              value={form.tags}
              onChange={(values) => handleMultiSelectChange('tags', values)}
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
            />
            <SelectField
              label="Titelbild"
              value={form.image}
              onChange={(value) => handleChange('image', value)}
              placeholder="Bild auswählen"
              options={media.map((item) => ({ label: item.alt || item.filename || 'Bild', value: item.id }))}
            />
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Kosten & Anmeldung</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CheckboxField
            label="Kostenlos"
            checked={form.isFree}
            onChange={(value) => handleChange('isFree', value)}
          />
          <CheckboxField
            label="Anmeldung erforderlich"
            checked={form.registrationRequired}
            onChange={(value) => handleChange('registrationRequired', value)}
          />
          <Field
            label="Kosten / Preisdetails"
            value={form.costDetails}
            onChange={(value) => handleChange('costDetails', value)}
          />
          <Field
            label="Anmeldedetails"
            value={form.registrationDetails}
            onChange={(value) => handleChange('registrationDetails', value)}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Speichert …' : 'Als Entwurf speichern'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('pending')}
          disabled={saving}
          className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Zur Prüfung einreichen
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, required, value, onChange }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    />
  </label>
);

const TextareaField = ({ label, value, onChange, required, rows = 4 }) => (
  <label className="mt-4 flex flex-col text-sm font-medium text-gray-700">
    {label}
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const DatetimeField = ({ label, value, onChange, required }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      type="datetime-local"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const DateField = ({ label, value, onChange }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    >
      <option value="">{placeholder ?? 'Bitte auswählen'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const MultiSelectField = ({ label, value, onChange, options }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <select
      multiple
      value={value}
      onChange={(event) => {
        const values = Array.from(event.target.selectedOptions).map((option) => option.value);
        onChange(values);
      }}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <span className="mt-1 text-xs text-gray-500">
      Mehrfachauswahl mit gedrückter Strg/Cmd-Taste.
    </span>
  </label>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <label className="mt-2 flex items-center space-x-3 text-sm font-medium text-gray-700">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-[#7CB92C] focus:ring-[#7CB92C]"
    />
    <span>{label}</span>
  </label>
);

export default OrganizerEventForm;
