import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { withAuthHeaders } from '../../utils/authHeaders';
import { HelpSection } from '../../components/HelpTooltip';
import { listMyOrganizations, listAllOrganizations } from '../../api/organizations';

const emptyOrganization = {
  id: null,
  name: '',
  email: '',
  contactPerson: '',
  phone: '',
  website: '',
  approved: false,
  role: 'organizer',
  address: {
    street: '',
    number: '',
    postalCode: '',
    city: 'Berlin',
  },
};

const OrganizationProfilePage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [organization, setOrganization] = useState(emptyOrganization);
  const [initialOrganization, setInitialOrganization] = useState(emptyOrganization);
  const [loading, setLoading] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if user can edit the current organization
  const canEdit = useMemo(() => {
    if (!user || !organization.id) return false;
    // Admins can edit all organizations
    if (user.role === 'admin') return true;
    // Editors can only edit organizations they belong to
    if (user.role === 'editor') {
      const ownerId = typeof organization.owner === 'object' ? organization.owner?.id : organization.owner;
      if (ownerId === user.id) return true;
      const userOrgIds = (user.organizations || []).map((o) => typeof o === 'object' ? o.id : o);
      return userOrgIds.includes(organization.id);
    }
    // Regular users (organizers) cannot edit
    return false;
  }, [user, organization]);

  // Check if user can delete the current organization (admin only)
  const canDelete = useMemo(() => {
    if (!user || !organization.id) return false;
    return user.role === 'admin';
  }, [user, organization]);

  const normalizeOrganization = useCallback((doc) => {
    const payloadDoc = doc?.doc ?? doc;
    if (!payloadDoc) return emptyOrganization;
    return {
      ...emptyOrganization,
      ...payloadDoc,
      address: {
        ...emptyOrganization.address,
        ...(payloadDoc.address || {}),
      },
    };
  }, []);

  // Load all organizations the user has access to
  useEffect(() => {
    let mounted = true;

    const loadOrganizations = async () => {
      if (!user) return;
      setLoadingOrgs(true);

      try {
        const data = user.role === 'admin' || user.role === 'editor'
          ? await listAllOrganizations({ limit: 200 })
          : await listMyOrganizations();
        
        const orgs = Array.isArray(data?.docs) ? data.docs : [];
        
        if (mounted) {
          setOrganizations(orgs);
          // Auto-select first organization if none selected
          if (orgs.length > 0 && !selectedOrgId) {
            setSelectedOrgId(orgs[0].id);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden der Organisationen');
          setOrganizations([]);
        }
      } finally {
        if (mounted) setLoadingOrgs(false);
      }
    };

    loadOrganizations();
    return () => { mounted = false; };
  }, [user]);

  // Load selected organization details
  useEffect(() => {
    let mounted = true;

    const loadOrganization = async () => {
      if (!selectedOrgId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setMessage('');
      setError('');

      try {
        const response = await fetch(buildApiUrl(`/api/organizations/${selectedOrgId}?depth=1`), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error('Organisation konnte nicht geladen werden');
        }
        
        const data = await response.json();
        
        if (mounted) {
          const normalized = normalizeOrganization(data);
          setOrganization(normalized);
          setInitialOrganization(normalized);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrganization();
    return () => { mounted = false; };
  }, [selectedOrgId, normalizeOrganization]);

  const handleChange = (field, value) => {
    setOrganization((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setOrganization((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!organization.id) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(buildApiUrl(`/api/organizations/${organization.id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: organization.name,
          email: organization.email,
          contactPerson: organization.contactPerson,
          phone: organization.phone,
          website: organization.website,
          address: organization.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Speichern fehlgeschlagen');
      }

      const updated = await response.json();
      const normalized = normalizeOrganization(updated);
      setOrganization(normalized);
      setInitialOrganization(normalized);
      setMessage('Organisation wurde gespeichert.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!organization.id || !canDelete) return;

    setDeleting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(buildApiUrl(`/api/organizations/${organization.id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: withAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen');
      }

      // Remove from local list and select another org
      const remainingOrgs = organizations.filter((o) => o.id !== organization.id);
      setOrganizations(remainingOrgs);
      setShowDeleteConfirm(false);
      
      if (remainingOrgs.length > 0) {
        setSelectedOrgId(remainingOrgs[0].id);
      } else {
        setSelectedOrgId(null);
        setOrganization(emptyOrganization);
      }
      setMessage('Organisation wurde gelöscht.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Organisation</p>
          <h1 className="text-3xl font-bold text-gray-900">Profil verwalten</h1>
          <p className="text-sm text-gray-600">
            Aktualisiere die Kontaktdaten deiner Organisation. Diese Informationen erscheinen im MoaFinder.
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold">Freigabestatus</p>
          <p>{organization.approved ? 'Freigegeben durch Redaktion' : 'Freigabe ausstehend'}</p>
        </div>
      </div>

      {/* Organization selector dropdown */}
      {organizations.length > 1 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Organisation auswählen
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={loadingOrgs}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            >
              {loadingOrgs ? (
                <option value="">Lade Organisationen…</option>
              ) : (
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.approved ? '' : '(Freigabe ausstehend)'}
                  </option>
                ))
              )}
            </select>
            <span className="mt-1 text-xs text-gray-500">
              Du gehörst zu {organizations.length} Organisation{organizations.length !== 1 ? 'en' : ''}.
              {(user?.role === 'admin' || user?.role === 'editor') && ' Als Redakteur/Admin siehst du alle Organisationen.'}
            </span>
          </label>
        </div>
      )}

      {/* Show info when user has no organizations */}
      {!loadingOrgs && organizations.length === 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Du gehörst noch keiner Organisation an. Bitte kontaktiere einen Administrator, um einer Organisation zugewiesen zu werden.
        </div>
      )}

      {/* Help section explaining organization management */}
      <HelpSection title="Was ist eine Organisation?">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Über Organisationen:</strong>
            <p className="mt-1">Eine Organisation ist der Veranstalter hinter deinen Events. Alle Veranstaltungen, Orte und Bilder sind einer Organisation zugeordnet.</p>
          </div>
          <div>
            <strong className="text-blue-800">Freigabeprozess:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Neue Organisationen müssen von der <strong>Redaktion freigegeben</strong> werden.</li>
              <li>Erst nach Freigabe können deine Veranstaltungen veröffentlicht werden.</li>
              <li>Der aktuelle Status wird oben rechts angezeigt.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Kontaktdaten:</strong>
            <p className="mt-1">Die hier eingegebenen Informationen können öffentlich im MoaFinder angezeigt werden. Bitte halte sie aktuell.</p>
          </div>
        </div>
      </HelpSection>

      {loading || loadingOrgs ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Organisation …</div>
      ) : !organization.id ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Wähle eine Organisation aus der Liste aus, um deren Profil zu bearbeiten.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!canEdit && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Du siehst dieses Profil im Nur-Lese-Modus. Nur Redakteure und Admins können Organisationen bearbeiten, denen sie angehören.
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>
          )}

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Basisdaten</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Name der Organisation
                <input
                  value={organization.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                E-Mail-Adresse
                <input
                  type="email"
                  value={organization.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Kontaktperson
                <input
                  value={organization.contactPerson}
                  onChange={(event) => handleChange('contactPerson', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Telefon
                <input
                  value={organization.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                Webseite
                <input
                  value={organization.website}
                  onChange={(event) => handleChange('website', event.target.value)}
                  placeholder="https://"
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Adresse</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Straße
                <input
                  value={organization.address.street}
                  onChange={(event) => handleAddressChange('street', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Hausnummer
                <input
                  value={organization.address.number}
                  onChange={(event) => handleAddressChange('number', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                PLZ
                <input
                  value={organization.address.postalCode}
                  onChange={(event) => handleAddressChange('postalCode', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Stadt
                <input
                  value={organization.address.city}
                  onChange={(event) => handleAddressChange('city', event.target.value)}
                  disabled={!canEdit}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </section>

          {canEdit && (
            <div className="flex items-center justify-between gap-3">
              {/* Delete button - admin only */}
              {canDelete && (
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-700">Wirklich löschen?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deleting ? 'Löschen …' : 'Ja, löschen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Organisation löschen
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setOrganization(normalizeOrganization(initialOrganization))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Zurücksetzen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-[#7CB92C] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Speichern …' : 'Änderungen speichern'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default OrganizationProfilePage;
