import React, { useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';

const statusOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'pending', label: 'Freigabe ausstehend' },
  { value: 'approved', label: 'Freigegeben' },
];

const EditorOrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadOrganizations = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ limit: '200', sort: 'name' });
        const response = await fetch(buildApiUrl(`/api/organizations?${params.toString()}`), {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Organisationen konnten nicht geladen werden');
        const data = await response.json();
        if (mounted) {
          setOrganizations(Array.isArray(data.docs) ? data.docs : []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrganizations();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return organizations.reduce(
      (acc, org) => {
        const status = org.approved ? 'approved' : 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { approved: 0, pending: 0 },
    );
  }, [organizations]);

  const filtered = useMemo(() => {
    return organizations.filter((org) => {
      if (activeFilter === 'approved' && !org.approved) return false;
      if (activeFilter === 'pending' && org.approved) return false;
      if (searchTerm) {
        const value = `${org.name ?? ''} ${org.email ?? ''}`.toLowerCase();
        if (!value.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  }, [organizations, activeFilter, searchTerm]);

  const handleApprovalChange = async (id, approved) => {
    try {
      setProcessingId(id);
      const response = await fetch(buildApiUrl(`/api/organizations/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) throw new Error('Status konnte nicht aktualisiert werden');
      setOrganizations((prev) => prev.map((org) => (org.id === id ? { ...org, approved } : org)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Statusaktualisierung fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Profile der Organisationen</h1>
        <p className="text-sm text-gray-600">
          Prüfe neue Veranstalterprofile, vergebe Freigaben und pflege die Stammdaten der Organisationen.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard label="Freigabe ausstehend" value={counts.pending ?? 0} active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
        <SummaryCard label="Freigegeben" value={counts.approved ?? 0} active={activeFilter === 'approved'} onClick={() => setActiveFilter('approved')} />
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3 text-sm">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-full px-4 py-1 font-semibold transition ${
                activeFilter === option.value ? 'bg-[#7CB92C] text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-64">
          <input
            type="search"
            placeholder="Organisation suchen …"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Organisationen …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Organisationen gefunden.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((org) => (
            <article key={org.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                {org.logo?.url ? (
                  <img src={org.logo.url} alt={org.logo.alt || org.name} className="h-16 w-16 rounded-md object-contain" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">Logo</div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{org.name ?? 'Ohne Namen'}</h2>
                  <p className="text-sm text-gray-600">{org.address?.street ? `${org.address.street} ${org.address.number ?? ''}, ${org.address.postalCode ?? ''} ${org.address.city ?? ''}` : 'Adresse folgt'}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Erstellt am {new Date(org.createdAt).toLocaleDateString('de-DE')}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>{org.contactPerson}</p>
                    <p>{org.email}</p>
                    {org.phone && <p>{org.phone}</p>}
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-[#417225] hover:underline">
                        {org.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={processingId === org.id}
                  className={`rounded-md px-4 py-2 font-semibold transition ${
                    org.approved ? 'border border-gray-300 text-gray-700 hover:border-[#7CB92C]' : 'bg-[#7CB92C] text-black hover:bg-[#5a8b20]'
                  }`}
                  onClick={() => handleApprovalChange(org.id, !org.approved)}
                >
                  {org.approved ? 'Freigabe entziehen' : 'Freigeben'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorOrganizationsPage;

const SummaryCard = ({ label, value, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow ${
      active ? 'border-[#7CB92C] bg-[#F0F8E8]' : 'border-gray-200 bg-white'
    }`}
  >
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    <span className="text-2xl font-semibold text-gray-900">{value}</span>
  </button>
);
