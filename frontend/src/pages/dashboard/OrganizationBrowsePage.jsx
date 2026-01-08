import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../../api/baseUrl';
import { withAuthHeaders } from '../../utils/authHeaders';
import { requestMembership } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import { HelpSection } from '../../components/HelpTooltip';

const OrganizationBrowsePage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Get user's current organization IDs
  const userOrgIds = useMemo(() => {
    if (!user?.organizations) return [];
    return user.organizations.map((o) => (typeof o === 'object' ? o.id : o));
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadOrganizations = async () => {
      setLoading(true);
      setError('');
      try {
        // Load all approved organizations
        const params = new URLSearchParams({
          limit: '200',
          sort: 'name',
          'where[approved][equals]': 'true',
        });
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

  const filtered = useMemo(() => {
    if (!searchTerm) return organizations;
    return organizations.filter((org) => {
      const value = `${org.name ?? ''} ${org.email ?? ''}`.toLowerCase();
      return value.includes(searchTerm.toLowerCase());
    });
  }, [organizations, searchTerm]);

  const handleRequestMembership = async (orgId) => {
    try {
      setRequestingId(orgId);
      setError('');
      await requestMembership(orgId, requestMessage);
      setSuccessMessage('Mitgliedschaftsanfrage wurde gesendet!');
      setShowMessageModal(null);
      setRequestMessage('');
      // Mark organization as having a pending request (UI only)
      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === orgId
            ? { ...org, _hasPendingRequest: true }
            : org
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden der Anfrage');
    } finally {
      setRequestingId('');
    }
  };

  const isMember = (orgId) => userOrgIds.includes(orgId);
  const hasPendingRequest = (org) => {
    if (org._hasPendingRequest) return true;
    // Check if user has a pending request in the org's membershipRequests
    const requests = org.membershipRequests || [];
    return requests.some((r) => {
      const reqUserId = typeof r.user === 'object' ? r.user.id : r.user;
      return reqUserId === user?.id && r.status === 'pending';
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900">Organisationen durchsuchen</h1>
        <p className="text-sm text-gray-600">
          Finde Organisationen in Moabit und beantrage eine Mitgliedschaft.
        </p>
      </header>

      <HelpSection title="Wie trete ich einer Organisation bei?">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Was sind Organisationen?</strong>
            <p className="mt-1">Organisationen sind Vereine, Initiativen oder Veranstalter in Moabit. Um Veranstaltungen zu erstellen, musst du Mitglied mindestens einer Organisation sein.</p>
          </div>
          <div>
            <strong className="text-blue-800">Schritt-für-Schritt Mitgliedschaft beantragen:</strong>
            <ol className="mt-1 ml-4 list-decimal space-y-1">
              <li><strong>Organisation suchen:</strong> Nutze die Suchfunktion oder scrolle durch die Liste.</li>
              <li><strong>Anfrage stellen:</strong> Klicke auf "Mitgliedschaft anfragen".</li>
              <li><strong>Nachricht hinzufügen:</strong> Optional kannst du erklären, warum du beitreten möchtest.</li>
              <li><strong>Bestätigen:</strong> Klicke auf "Anfrage senden".</li>
            </ol>
          </div>
          <div>
            <strong className="text-blue-800">Was passiert nach der Anfrage?</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Deine Anfrage wird an die Redaktion gesendet und geprüft.</li>
              <li>Der Status "Anfrage ausstehend" wird bei der Organisation angezeigt.</li>
              <li>Nach Genehmigung wirst du automatisch der Organisation hinzugefügt.</li>
              <li>Du kannst dann Veranstaltungen und Orte für diese Organisation erstellen.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Organisation nicht gefunden?</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Hier werden nur <strong>freigegebene</strong> Organisationen angezeigt.</li>
              <li>Wenn deine Organisation noch nicht existiert, kannst du sie über "Neue Organisation" anlegen.</li>
            </ul>
          </div>
          <div className="mt-2 rounded bg-green-100 p-2">
            <strong className="text-green-800">Bereits Mitglied?</strong>
            <span className="ml-1">Bei Organisationen, in denen du Mitglied bist, siehst du ein grünes "✓ Mitglied"-Badge.</span>
          </div>
        </div>
      </HelpSection>

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          {organizations.length} freigegebene Organisation{organizations.length !== 1 ? 'en' : ''}
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Organisation suchen …"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-64"
          />
          <Link
            to="/dashboard/organization/new"
            className="whitespace-nowrap rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20]"
          >
            Neue Organisation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Lade Organisationen …
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Keine Organisationen gefunden.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <article
              key={org.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {org.logo?.url ? (
                  <img
                    src={org.logo.url}
                    alt={org.logo.alt || org.name}
                    className="h-12 w-12 rounded-md object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500">
                    Logo
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{org.name}</h2>
                  {org.address?.street && (
                    <p className="text-sm text-gray-600 truncate">
                      {org.address.street} {org.address.number}, {org.address.postalCode} {org.address.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex-1">
                {org.contactPerson && (
                  <p className="text-sm text-gray-600">{org.contactPerson}</p>
                )}
                {org.email && (
                  <p className="text-sm text-gray-500">{org.email}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                {isMember(org.id) ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    ✓ Mitglied
                  </span>
                ) : hasPendingRequest(org) ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    Anfrage ausstehend
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(org.id)}
                    disabled={requestingId === org.id}
                    className="w-full rounded-md border border-[#7CB92C] px-4 py-2 text-sm font-semibold text-[#417225] hover:bg-[#7CB92C] hover:text-black disabled:opacity-50"
                  >
                    {requestingId === org.id ? 'Wird gesendet …' : 'Mitgliedschaft anfragen'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Mitgliedschaft anfragen</h3>
            <p className="mt-1 text-sm text-gray-600">
              Optional: Füge eine Nachricht hinzu, warum du dieser Organisation beitreten möchtest.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
              rows={4}
              placeholder="z.B. Ich bin ehrenamtlich bei dieser Organisation tätig und möchte Veranstaltungen einstellen."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMessageModal(null);
                  setRequestMessage('');
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleRequestMembership(showMessageModal)}
                disabled={requestingId === showMessageModal}
                className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-50"
              >
                {requestingId === showMessageModal ? 'Wird gesendet …' : 'Anfrage senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationBrowsePage;
