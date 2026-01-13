import React, { useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import { HelpSection } from '../../components/HelpTooltip';
import { handleMembershipRequest } from '../../api/organizations';
import ImageWithFallback from '../../components/ImageWithFallback';

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
        const params = new URLSearchParams({ limit: '200', sort: 'name', depth: '2' });
        const response = await fetch(buildApiUrl(`/api/organizations?${params.toString()}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
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
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
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

  const handleMembership = async (orgId, userId, action) => {
    try {
      setProcessingId(`${orgId}-${userId}`);
      await handleMembershipRequest(orgId, userId, action);
      // Update local state to reflect the change
      setOrganizations((prev) =>
        prev.map((org) => {
          if (org.id !== orgId) return org;
          const updatedRequests = (org.membershipRequests || []).map((r) => {
            const reqUserId = typeof r.user === 'object' ? r.user.id : r.user;
            if (reqUserId === userId) {
              return { ...r, status: action === 'approve' ? 'approved' : 'rejected' };
            }
            return r;
          });
          return { ...org, membershipRequests: updatedRequests };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anfrage konnte nicht bearbeitet werden');
    } finally {
      setProcessingId('');
    }
  };

  // Count pending membership requests
  const pendingMembershipCount = useMemo(() => {
    return organizations.reduce((count, org) => {
      const pending = (org.membershipRequests || []).filter((r) => r.status === 'pending');
      return count + pending.length;
    }, 0);
  }, [organizations]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
        <h1 className="text-3xl font-bold text-gray-900">Profile der Organisationen</h1>
        <p className="text-sm text-gray-600">
          Prüfe neue Veranstalterprofile, vergebe Freigaben und pflege die Stammdaten der Organisationen.
        </p>
      </header>

      {/* Help section for editors/admins */}
      <HelpSection title="Organisationen verwalten (Redaktion)">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Freigabeprozess:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Neue Organisationen starten mit Status <strong>"Freigabe ausstehend"</strong>.</li>
              <li>Nach Prüfung der Daten kannst du die Organisation <strong>freigeben</strong>.</li>
              <li>Erst nach Freigabe können Veranstaltungen der Organisation veröffentlicht werden.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Was prüfen?</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Ist die Organisation real und in Moabit aktiv?</li>
              <li>Sind die Kontaktdaten vollständig und plausibel?</li>
              <li>Gibt es bereits einen Eintrag für diese Organisation?</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Freigabe zurücknehmen:</strong>
            <p className="mt-1">Du kannst die Freigabe jederzeit zurücknehmen. Die Veranstaltungen der Organisation werden dann nicht mehr öffentlich angezeigt.</p>
          </div>
        </div>
      </HelpSection>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Freigabe ausstehend" value={counts.pending ?? 0} active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
        <SummaryCard label="Freigegeben" value={counts.approved ?? 0} active={activeFilter === 'approved'} onClick={() => setActiveFilter('approved')} />
        <SummaryCard label="Mitgliedschaftsanfragen" value={pendingMembershipCount} active={false} onClick={() => {}} highlight={pendingMembershipCount > 0} />
      </div>

      {/* Pending Membership Requests Section */}
      {pendingMembershipCount > 0 && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="mb-3 text-lg font-semibold text-yellow-800">
            Offene Mitgliedschaftsanfragen ({pendingMembershipCount})
          </h2>
          <div className="space-y-3">
            {organizations.map((org) => {
              const pendingRequests = (org.membershipRequests || []).filter((r) => r.status === 'pending');
              if (pendingRequests.length === 0) return null;
              return (
                <div key={org.id} className="rounded-md bg-white p-3 shadow-sm">
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                  <div className="mt-2 space-y-2">
                    {pendingRequests.map((request, idx) => {
                      const userId = typeof request.user === 'object' ? request.user.id : request.user;
                      const userName = typeof request.user === 'object' ? request.user.name || request.user.email : userId;
                      const userEmail = typeof request.user === 'object' ? request.user.email : '';
                      const processingThis = processingId === `${org.id}-${userId}`;
                      return (
                        <div key={idx} className="flex flex-col gap-2 rounded border border-gray-200 bg-gray-50 p-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                            {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
                            {request.message && (
                              <p className="mt-1 text-xs text-gray-600 italic">"{request.message}"</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Angefragt am {new Date(request.requestedAt).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleMembership(org.id, userId, 'approve')}
                              disabled={processingThis}
                              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Genehmigen
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMembership(org.id, userId, 'reject')}
                              disabled={processingThis}
                              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Ablehnen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={org.logo?.url}
                    alt={org.logo?.alt || org.name}
                    className="h-full w-full"
                    showPlaceholderIndicator={!org.logo?.url}
                    placeholderLabel="Logo"
                  />
                </div>
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

const SummaryCard = ({ label, value, active, onClick, highlight }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow ${
      active ? 'border-[#7CB92C] bg-[#F0F8E8]' : highlight ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'
    }`}
  >
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    <span className={`text-2xl font-semibold ${highlight ? 'text-yellow-700' : 'text-gray-900'}`}>{value}</span>
  </button>
);
