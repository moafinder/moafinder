import React, { useEffect, useState } from 'react';
import { listEvents } from '../../api/events';
import { listMedia } from '../../api/media';
import { listLocations } from '../../api/locations';
import { buildApiUrl } from '../../api/baseUrl';

const AdminOverviewPage = () => {
  const [stats, setStats] = useState({ users: 0, events: 0, organizations: 0, media: 0, locations: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [eventsRes, organizationsRes, mediaRes, locationsRes, usersRes] = await Promise.all([
          listEvents({ limit: 1 }),
          fetch(buildApiUrl('/api/organizations?limit=1'), { credentials: 'include' }).then((res) => res.json()),
          listMedia({ limit: 1 }),
          listLocations({ limit: 1 }),
          fetch(buildApiUrl('/api/users?limit=1'), { credentials: 'include' }).then((res) => res.json()),
        ]);
        if (!mounted) return;
        setStats({
          events: eventsRes.totalDocs ?? eventsRes.docs?.length ?? 0,
          organizations: organizationsRes.totalDocs ?? organizationsRes.docs?.length ?? 0,
          media: mediaRes.totalDocs ?? mediaRes.docs?.length ?? 0,
          locations: locationsRes.totalDocs ?? locationsRes.docs?.length ?? 0,
          users: usersRes.totalDocs ?? usersRes.docs?.length ?? 0,
        });
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Kennzahlen konnten nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Admin</p>
        <h1 className="text-3xl font-bold text-gray-900">Systemübersicht</h1>
        <p className="text-sm text-gray-600">Zentrale Kennzahlen zum MoaFinder. Detaildaten findest du in Payload.</p>
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Benutzer*innen" value={loading ? '…' : stats.users} description="Aktive Accounts" />
        <StatCard label="Organisationen" value={loading ? '…' : stats.organizations} description="Veranstalterprofile" />
        <StatCard label="Veranstaltungen" value={loading ? '…' : stats.events} description="Alle Einträge" />
        <StatCard label="Orte" value={loading ? '…' : stats.locations} description="Aktive Locations" />
        <StatCard label="Medien" value={loading ? '…' : stats.media} description="Uploaded Dateien" />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm text-sm text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Wartung & Hinweise</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Backups werden täglich um 02:00 CET eingeplant (siehe technische Doku).</li>
          <li>Payload- und Node-Versionen sollten monatlich auf Updates geprüft werden.</li>
          <li>Staging-Deployment vor Produktiv-Deployment testen.</li>
          <li>SSL-Zertifikat läuft jährlich aus – Erinnerung im Kalender hinterlegen.</li>
        </ul>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, description }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
  </div>
);

export default AdminOverviewPage;
