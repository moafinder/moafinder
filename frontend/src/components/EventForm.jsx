import React, { useState } from 'react';

const dayOptions = [
  { label: 'Montag', value: 'mon' },
  { label: 'Dienstag', value: 'tue' },
  { label: 'Mittwoch', value: 'wed' },
  { label: 'Donnerstag', value: 'thu' },
  { label: 'Freitag', value: 'fri' },
  { label: 'Samstag', value: 'sat' },
  { label: 'Sonntag', value: 'sun' },
];

export default function EventForm({ initialData = {}, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'einmalig',
    startDate: '',
    endDate: '',
    recurrence: { daysOfWeek: [], repeatUntil: '' },
    ...initialData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecurrenceChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, [name]: value },
    }));
  };

  const handleDaysChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, daysOfWeek: values },
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block mb-1">Titel</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Beschreibung</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Art der Veranstaltung</label>
        <select
          name="eventType"
          value={form.eventType}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="einmalig">Einmalig</option>
          <option value="täglich">Täglich</option>
          <option value="wöchentlich">Wöchentlich</option>
          <option value="monatlich">Monatlich</option>
          <option value="jährlich">Jährlich</option>
        </select>
      </div>

      <div>
        <label className="block mb-1">Startdatum</label>
        <input
          type="datetime-local"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Enddatum</label>
        <input
          type="datetime-local"
          name="endDate"
          value={form.endDate || ''}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>

      {form.eventType !== 'einmalig' && (
        <div className="space-y-2 border p-2">
          <p className="font-semibold">Wiederholung</p>

          <div>
            <label className="block mb-1">Wochentage</label>
            <select
              multiple
              name="daysOfWeek"
              value={form.recurrence.daysOfWeek}
              onChange={handleDaysChange}
              className="border p-2 w-full"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Wiederholen bis</label>
            <input
              type="date"
              name="repeatUntil"
              value={form.recurrence.repeatUntil || ''}
              onChange={handleRecurrenceChange}
              className="border p-2 w-full"
            />
          </div>
        </div>
      )}

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Speichern
      </button>
    </form>
  );
}
