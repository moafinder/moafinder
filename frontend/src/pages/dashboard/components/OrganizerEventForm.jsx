import React, { useEffect, useMemo, useState } from 'react';
import { listLocations } from '../../../api/locations';
import { listTags } from '../../../api/tags';
import { buildApiUrl } from '../../../api/baseUrl';
import { useAuth } from '../../../context/AuthContext';
import { withAuthHeaders } from '../../../utils/authHeaders';

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
  // Simplified time inputs
  firstDate: '', // YYYY-MM-DD
  firstTime: '', // HH:MM
  durationHours: '', // string to bind input, parse to int
  durationMinutes: '', // string to bind input, parse to int
  // Recurrence
  recurrenceDays: [], // for weekly only
  lastDate: '', // YYYY-MM-DD (last occurrence)
  // Monthly options
  monthlyMode: 'dayOfMonth', // 'dayOfMonth' | 'nthWeekday'
  monthlyDayOfMonth: '', // 1-31
  monthlyWeekIndex: 'first', // first|second|third|fourth|last
  monthlyWeekday: 'mon',
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

function extractErrorMessage(err) {
  if (!err) return 'Speichern fehlgeschlagen.';
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
      return parsed.errors[0].message ?? 'Bitte prüfe die Eingaben.';
    }
  } catch {
    // ignore JSON parse issues
  }
  if (/ValidationError/i.test(raw)) {
    return 'Bitte prüfe die Eingaben. Pflichtfelder sind erforderlich.';
  }
  return raw || 'Speichern fehlgeschlagen.';
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
      // First occurrence date/time
      firstDate: initialEvent.startDate ? new Date(initialEvent.startDate).toISOString().slice(0, 10) : '',
      firstTime:
        initialEvent.time?.from ??
        (initialEvent.startDate ? new Date(initialEvent.startDate).toISOString().slice(11, 16) : ''),
      // Duration derived from end-start or time.to-time.from when available
      ...(function deriveDuration() {
        try {
          const start = initialEvent.startDate ? new Date(initialEvent.startDate) : null;
          const end = initialEvent.endDate ? new Date(initialEvent.endDate) : null;
          let minutes = 0;
          if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
          } else if (initialEvent.time?.from && initialEvent.time?.to) {
            const [fh, fm] = String(initialEvent.time.from).split(':').map((v) => parseInt(v, 10) || 0);
            const [th, tm] = String(initialEvent.time.to).split(':').map((v) => parseInt(v, 10) || 0);
            minutes = Math.max(0, th * 60 + tm - (fh * 60 + fm));
          }
          const hours = minutes ? Math.floor(minutes / 60) : '';
          const mins = minutes ? minutes % 60 : '';
          return { durationHours: hours === '' ? '' : String(hours), durationMinutes: mins === '' ? '' : String(mins) };
        } catch {
          return { durationHours: '', durationMinutes: '' };
        }
      })(),
      // Recurrence
      recurrenceDays: initialEvent.recurrence?.daysOfWeek ?? [],
      lastDate: initialEvent.recurrence?.repeatUntil ? initialEvent.recurrence.repeatUntil.slice(0, 10) : '',
      // Monthly details (best-effort defaults)
      monthlyMode: initialEvent.recurrence?.monthlyMode ?? 'dayOfMonth',
      monthlyDayOfMonth:
        initialEvent.recurrence?.monthlyDayOfMonth ??
        (initialEvent.startDate ? String(new Date(initialEvent.startDate).getDate()) : ''),
      monthlyWeekIndex: initialEvent.recurrence?.monthlyWeekIndex ?? 'first',
      monthlyWeekday: initialEvent.recurrence?.monthlyWeekday ?? 'mon',
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
          fetch(buildApiUrl('/api/media?limit=200'), {
            credentials: 'include',
            headers: withAuthHeaders(),
          }).then((response) => {
            if (!response.ok) {
              throw new Error('Medien konnten nicht geladen werden.');
            }
            return response.json();
          }),
        ]);

        if (!mounted) return;
        setLocations(locationsRes.docs ?? []);
        const uniqueTags = [];
        const seen = new Set();
        for (const rawTag of tagsRes.docs ?? []) {
          if (!rawTag) continue;
          const tagDoc = rawTag.doc ?? rawTag;
          if (!tagDoc) continue;
          const mergedTag = {
            ...tagDoc,
            id: tagDoc.id ?? rawTag.id,
            slug: tagDoc.slug ?? rawTag.slug,
          };
          const nameKey = typeof mergedTag.name === 'string' ? mergedTag.name.trim().toLowerCase() : null;
          const slugKey = typeof mergedTag.slug === 'string' ? mergedTag.slug.trim().toLowerCase() : null;
          const key = nameKey || slugKey || (typeof mergedTag.id === 'string' ? mergedTag.id : null);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          uniqueTags.push(mergedTag);
        }
        setTags(uniqueTags);
        setMedia(mediaRes.docs ?? []);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Stammdaten konnten nicht geladen werden.');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Validate first occurrence
      if (!form.firstDate) {
        throw new Error('Bitte gib das Datum der ersten Durchführung an.');
      }
      if (!form.firstTime) {
        throw new Error('Bitte gib die Uhrzeit der ersten Durchführung an.');
      }
      const startDateISO = (() => {
        try {
          const combined = `${form.firstDate}T${form.firstTime}`;
          const d = new Date(combined);
          if (Number.isNaN(d.getTime())) return null;
          return d.toISOString();
        } catch {
          return null;
        }
      })();
      if (!startDateISO) {
        throw new Error('Ungültiges Startdatum/Uhrzeit.');
      }

      // Validate duration
      const dh = parseInt(form.durationHours || '0', 10) || 0;
      const dm = parseInt(form.durationMinutes || '0', 10) || 0;
      const durationMinutes = dh * 60 + dm;
      if (durationMinutes <= 0) {
        throw new Error('Bitte gib eine Dauer größer 0 an.');
      }

      // Compute end date/time from duration
      const endDateISO = new Date(new Date(startDateISO).getTime() + durationMinutes * 60000).toISOString();
      const normalizedFrom = form.firstTime;
      const normalizedTo = new Date(endDateISO).toISOString().slice(11, 16);

      // Recurrence validation
      if (form.eventType !== 'einmalig') {
        if (!form.lastDate) {
          throw new Error('Bitte gib das Datum der letzten Durchführung an.');
        }
        if (form.lastDate < form.firstDate) {
          throw new Error('Das Enddatum der Serie muss nach dem ersten Datum liegen.');
        }
        if (form.eventType === 'wöchentlich' && (!form.recurrenceDays || form.recurrenceDays.length === 0)) {
          throw new Error('Bitte wähle mindestens einen Wochentag für wöchentliche Wiederholung aus.');
        }
        if (form.eventType === 'monatlich') {
          if (form.monthlyMode === 'dayOfMonth') {
            const day = parseInt(form.monthlyDayOfMonth || '0', 10);
            if (!day || day < 1 || day > 31) {
              throw new Error('Bitte gib einen gültigen Tag des Monats (1–31) an.');
            }
          } else if (form.monthlyMode === 'nthWeekday') {
            if (!form.monthlyWeekIndex || !form.monthlyWeekday) {
              throw new Error('Bitte wähle Woche und Wochentag für die monatliche Wiederholung.');
            }
          }
        }
      }

      const recurrencePayload = (() => {
        if (form.eventType === 'einmalig') return null;
        const base = { repeatUntil: form.lastDate || null };
        if (form.eventType === 'wöchentlich') {
          return { ...base, daysOfWeek: form.recurrenceDays };
        }
        if (form.eventType === 'monatlich') {
          const extra =
            form.monthlyMode === 'dayOfMonth'
              ? { monthlyMode: 'dayOfMonth', monthlyDayOfMonth: parseInt(form.monthlyDayOfMonth, 10) }
              : {
                  monthlyMode: 'nthWeekday',
                  monthlyWeekIndex: form.monthlyWeekIndex,
                  monthlyWeekday: form.monthlyWeekday,
                };
          return { ...base, ...extra };
        }
        // täglich / jährlich need no extra fields beyond end
        return base;
      })();

      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        eventType: form.eventType,
        startDate: startDateISO,
        endDate: endDateISO,
        recurrence: recurrencePayload,
        time: {
          from: normalizedFrom || null,
          to: normalizedTo || null,
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
      setError(extractErrorMessage(err));
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
        <p className="mt-2 text-sm text-gray-600">
          Gib die erste Durchführung, Uhrzeit und Dauer an. Für wiederkehrende Angebote wähle optional das Muster und das letzte Datum der Serie.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DateField
            label="Datum der ersten Durchführung"
            value={form.firstDate}
            onChange={(value) => handleChange('firstDate', value)}
          />
          <TimeField
            label="Uhrzeit der ersten Durchführung"
            value={form.firstTime}
            onChange={(value) => handleChange('firstTime', value)}
          />
          <div className="flex flex-col text-sm font-medium text-gray-700">
            Dauer
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                placeholder="Stunden"
                value={form.durationHours}
                onChange={(e) => handleChange('durationHours', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
              />
              <input
                type="number"
                min="0"
                placeholder="Minuten"
                value={form.durationMinutes}
                onChange={(e) => handleChange('durationMinutes', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
              />
            </div>
            <span className="mt-1 text-xs text-gray-500">Zeit zwischen Beginn und Ende.</span>
          </div>
          {!recurrenceDisabled && (
            <DateField
              label="Datum der letzten Durchführung"
              value={form.lastDate}
              onChange={(value) => handleChange('lastDate', value)}
              min={form.firstDate || undefined}
            />
          )}
        </div>

        {!recurrenceDisabled && (
          <div className="mt-6 space-y-4 rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Wiederholung</p>
            {form.eventType === 'wöchentlich' && (
              <>
                <p className="text-xs text-gray-500">Wähle die Wochentage für die Wiederholung.</p>
                <MultiSelectField
                  label="Wochentage"
                  value={form.recurrenceDays}
                  onChange={(values) => handleMultiSelectChange('recurrenceDays', values)}
                  options={WEEKDAY_OPTIONS}
                />
              </>
            )}
            {form.eventType === 'monatlich' && (
              <>
                <p className="text-xs text-gray-500">Monatliche Wiederholung nach Datum oder Wochentag.</p>
                <SelectField
                  label="Wiederholungsmodus"
                  value={form.monthlyMode}
                  onChange={(value) => handleChange('monthlyMode', value)}
                  options={[
                    { label: 'Am Tag des Monats (z. B. 1.)', value: 'dayOfMonth' },
                    { label: 'Am Wochentag im Monat (z. B. 1. Dienstag)', value: 'nthWeekday' },
                  ]}
                />
                {form.monthlyMode === 'dayOfMonth' ? (
                  <Field
                    label="Tag des Monats"
                    value={form.monthlyDayOfMonth}
                    onChange={(value) => handleChange('monthlyDayOfMonth', value)}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Welche Woche"
                      value={form.monthlyWeekIndex}
                      onChange={(value) => handleChange('monthlyWeekIndex', value)}
                      options={[
                        { label: 'Erste', value: 'first' },
                        { label: 'Zweite', value: 'second' },
                        { label: 'Dritte', value: 'third' },
                        { label: 'Vierte', value: 'fourth' },
                        { label: 'Letzte', value: 'last' },
                      ]}
                    />
                    <SelectField
                      label="Wochentag"
                      value={form.monthlyWeekday}
                      onChange={(value) => handleChange('monthlyWeekday', value)}
                      options={WEEKDAY_OPTIONS}
                    />
                  </div>
                )}
              </>
            )}
            {(form.eventType === 'täglich' || form.eventType === 'jährlich') && (
              <p className="text-xs text-gray-500">Für tägliche und jährliche Wiederholungen sind keine Wochentage nötig.</p>
            )}
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
            <TagPicker
              label="Tags (max. 6)"
              value={form.tags}
              onChange={(values) => handleMultiSelectChange('tags', values)}
              options={tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))}
              max={6}
            />
            <SelectField
              label="Titelbild"
              value={form.image}
              onChange={(value) => handleChange('image', value)}
              placeholder="Bild auswählen"
              options={media.map((item) => ({
                label: item.alt || item.filename || 'Bild',
                value: item.id,
              }))}
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
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
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

const DateField = ({ label, value, onChange, min }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      type="date"
      value={value}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
  </label>
);

const TimeField = ({ label, value, onChange, helper }) => (
  <label className="flex flex-col text-sm font-medium text-gray-700">
    {label}
    <input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
    />
    {helper && <span className="mt-1 text-xs text-gray-500">{helper}</span>}
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
    <span className="mt-1 text-xs text-gray-500">Mehrfachauswahl mit gedrückter Strg/Cmd-Taste.</span>
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

// Custom tag picker to avoid Ctrl/Cmd multi-select usability issues
function TagPicker({ label, value, onChange, options, max = 6 }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((t) => t !== id));
      return;
    }
    if (selected.length >= max) return; // silently ignore beyond limit
    onChange([...selected, id]);
  };

  return (
    <div className="flex flex-col text-sm font-medium text-gray-700">
      <div className="flex items-baseline justify-between">
        <span>{label}</span>
        <span className="text-xs text-gray-500">{selected.length}/{max}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? 'border-[#7CB92C] bg-[#E8F5D9] text-gray-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              title={opt.name}
            >
              {active && (
                <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7CB92C] text-[10px] font-bold text-black">
                  {selected.indexOf(opt.id) + 1}
                </span>
              )}
              {opt.name}
            </button>
          );
        })}
      </div>
      {selected.length >= max && (
        <p className="mt-1 text-xs text-gray-500">Maximal {max} Tags auswählbar. Reihenfolge = Priorität.</p>
      )}
    </div>
  );
}
