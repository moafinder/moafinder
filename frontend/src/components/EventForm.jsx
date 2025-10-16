import React, { useMemo, useState } from 'react';

const dayOptions = [
  { label: 'Montag', value: 'mon' },
  { label: 'Dienstag', value: 'tue' },
  { label: 'Mittwoch', value: 'wed' },
  { label: 'Donnerstag', value: 'thu' },
  { label: 'Freitag', value: 'fri' },
  { label: 'Samstag', value: 'sat' },
  { label: 'Sonntag', value: 'sun' },
];

const weekIndexOptions = [
  { label: 'Erste', value: 'first' },
  { label: 'Zweite', value: 'second' },
  { label: 'Dritte', value: 'third' },
  { label: 'Vierte', value: 'fourth' },
  { label: 'Letzte', value: 'last' },
];

export default function EventForm({ initialData = {}, onSubmit }) {
  const [form, setForm] = useState(() => {
    // Map old shape to the new simplified inputs if needed
    const startDate = initialData.startDate ? new Date(initialData.startDate) : null;
    const endDate = initialData.endDate ? new Date(initialData.endDate) : null;
    const firstDate = startDate ? startDate.toISOString().slice(0, 10) : '';
    const firstTime = startDate ? startDate.toISOString().slice(11, 16) : '';
    let durationHours = '';
    let durationMinutes = '';
    if (startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
      durationHours = String(Math.floor(minutes / 60));
      durationMinutes = String(minutes % 60);
    }
    return {
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      eventType: initialData.eventType ?? 'einmalig',
      firstDate,
      firstTime,
      durationHours,
      durationMinutes,
      lastDate: initialData.recurrence?.repeatUntil ? initialData.recurrence.repeatUntil.slice(0, 10) : '',
      recurrenceDays: initialData.recurrence?.daysOfWeek ?? [],
      monthlyMode: initialData.recurrence?.monthlyMode ?? 'dayOfMonth',
      monthlyDayOfMonth:
        initialData.recurrence?.monthlyDayOfMonth ?? (startDate ? String(startDate.getDate()) : ''),
      monthlyWeekIndex: initialData.recurrence?.monthlyWeekIndex ?? 'first',
      monthlyWeekday: initialData.recurrence?.monthlyWeekday ?? 'mon',
    };
  });

  const disabledRecurrence = form.eventType === 'einmalig';
  const isWeekly = form.eventType === 'wöchentlich';
  const isMonthly = form.eventType === 'monatlich';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDaysChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, recurrenceDays: values }));
  };

  const submit = (e) => {
    e.preventDefault();
    // Build payload according to backend expectation
    if (!form.firstDate || !form.firstTime) return;
    const start = new Date(`${form.firstDate}T${form.firstTime}`);
    const dh = parseInt(form.durationHours || '0', 10) || 0;
    const dm = parseInt(form.durationMinutes || '0', 10) || 0;
    const durationMinutes = dh * 60 + dm;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const recurrence = disabledRecurrence
      ? null
      : (() => {
          const base = { repeatUntil: form.lastDate || null };
          if (isWeekly) {
            return { ...base, daysOfWeek: form.recurrenceDays };
          }
          if (isMonthly) {
            return form.monthlyMode === 'dayOfMonth'
              ? { ...base, monthlyMode: 'dayOfMonth', monthlyDayOfMonth: parseInt(form.monthlyDayOfMonth || '0', 10) }
              : {
                  ...base,
                  monthlyMode: 'nthWeekday',
                  monthlyWeekIndex: form.monthlyWeekIndex,
                  monthlyWeekday: form.monthlyWeekday,
                };
          }
          return base;
        })();

    onSubmit({
      title: form.title,
      description: form.description,
      eventType: form.eventType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      time: { from: form.firstTime, to: end.toISOString().slice(11, 16) },
      recurrence,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block mb-1">Titel</label>
        <input name="title" value={form.title} onChange={handleChange} className="border p-2 w-full" required />
      </div>

      <div>
        <label className="block mb-1">Beschreibung</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="border p-2 w-full" required />
      </div>

      <div>
        <label className="block mb-1">Art der Veranstaltung</label>
        <select name="eventType" value={form.eventType} onChange={handleChange} className="border p-2 w-full">
          <option value="einmalig">Einmalig</option>
          <option value="täglich">Täglich</option>
          <option value="wöchentlich">Wöchentlich</option>
          <option value="monatlich">Monatlich</option>
          <option value="jährlich">Jährlich</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1">Datum der ersten Durchführung</label>
          <input type="date" name="firstDate" value={form.firstDate} onChange={handleChange} className="border p-2 w-full" required />
        </div>
        <div>
          <label className="block mb-1">Uhrzeit der ersten Durchführung</label>
          <input type="time" name="firstTime" value={form.firstTime} onChange={handleChange} className="border p-2 w-full" required />
        </div>
        <div>
          <label className="block mb-1">Dauer (Stunden)</label>
          <input type="number" min="0" name="durationHours" value={form.durationHours} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block mb-1">Dauer (Minuten)</label>
          <input type="number" min="0" name="durationMinutes" value={form.durationMinutes} onChange={handleChange} className="border p-2 w-full" />
        </div>
      </div>

      {!disabledRecurrence && (
        <div className="space-y-3 border p-3 rounded">
          <div>
            <label className="block mb-1">Datum der letzten Durchführung</label>
            <input type="date" name="lastDate" value={form.lastDate || ''} onChange={handleChange} className="border p-2 w-full" />
          </div>
          {isWeekly && (
            <div>
              <label className="block mb-1">Wochentage</label>
              <select multiple name="recurrenceDays" value={form.recurrenceDays} onChange={handleDaysChange} className="border p-2 w-full">
                {dayOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isMonthly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Wiederholungsmodus</label>
                <select name="monthlyMode" value={form.monthlyMode} onChange={handleChange} className="border p-2 w-full">
                  <option value="dayOfMonth">Am Tag des Monats (z. B. 1.)</option>
                  <option value="nthWeekday">Am Wochentag im Monat (z. B. 1. Dienstag)</option>
                </select>
              </div>
              {form.monthlyMode === 'dayOfMonth' ? (
                <div>
                  <label className="block mb-1">Tag des Monats</label>
                  <input name="monthlyDayOfMonth" value={form.monthlyDayOfMonth} onChange={handleChange} className="border p-2 w-full" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block mb-1">Welche Woche</label>
                    <select name="monthlyWeekIndex" value={form.monthlyWeekIndex} onChange={handleChange} className="border p-2 w-full">
                      {weekIndexOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Wochentag</label>
                    <select name="monthlyWeekday" value={form.monthlyWeekday} onChange={handleChange} className="border p-2 w-full">
                      {dayOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Speichern</button>
    </form>
  );
}
