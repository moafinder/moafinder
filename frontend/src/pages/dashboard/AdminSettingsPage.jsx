import React from 'react';

const envInfo = [
  { label: 'Frontend Build', value: import.meta.env?.MODE ?? 'unknown' },
  { label: 'API Base URL', value: import.meta.env?.VITE_API_BASE_URL ?? 'relative /api' },
  { label: 'Node Version', value: import.meta.env?.VITE_NODE_VERSION ?? 'server-managed' },
];

const AdminSettingsPage = () => (
  <div className="space-y-6">
    <header>
      <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Admin</p>
      <h1 className="text-3xl font-bold text-gray-900">Einstellungen & Hinweise</h1>
      <p className="text-sm text-gray-600">
        Übersicht über Umgebungsvariablen und weiterführende Links für Wartung & Support.
      </p>
    </header>

    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Umgebungsvariablen</h2>
      <dl className="mt-4 space-y-3 text-sm text-gray-700">
        {envInfo.map((item) => (
          <div key={item.label} className="flex flex-col border-b border-gray-100 pb-3 last:border-none">
            <dt className="font-semibold">{item.label}</dt>
            <dd className="font-mono text-xs text-gray-600">{String(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>

    <section className="rounded-xl bg-white p-6 shadow-sm text-sm text-gray-700">
      <h2 className="text-lg font-semibold text-gray-900">Support & Dokumentation</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          Technische Dokumentation im Repository: <code className="font-mono">/frontend/moafinder-technical-documentation.md</code>
        </li>
        <li>Payload Admin: <code className="font-mono">/admin</code> (Nutzer mit Redaktions- oder Admin-Rolle)</li>
        <li>Kontakt: <a href="mailto:moafinder@moabit.world" className="text-[#417225] hover:underline">moafinder@moabit.world</a></li>
        <li>Backup-Zeitplan siehe Dokumentation Abschnitt 8.3</li>
      </ul>
    </section>
  </div>
);

export default AdminSettingsPage;
