import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiUrl } from '../../api/baseUrl';
import { useAuth } from '../../context/AuthContext';
import { withAuthHeaders } from '../../utils/authHeaders';
import { HelpSection } from '../../components/HelpTooltip';

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
  const [organization, setOrganization] = useState(emptyOrganization);
  const [initialOrganization, setInitialOrganization] = useState(emptyOrganization);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const ownerQuery = useMemo(() => {
    if (!user) return '';
    const params = new URLSearchParams({
      'where[owner][equals]': user.id,
      limit: '1',
      depth: '0',
    });
    return params.toString();
  }, [user]);

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

  useEffect(() => {
    let mounted = true;

    const loadOrganization = async () => {
      if (!user) return;
      setLoading(true);
      setMessage('');
      setError('');

      try {
        const response = await fetch(buildApiUrl(`/api/organizations?${ownerQuery}`), {
          credentials: 'include',
          headers: withAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Organisation konnte nicht geladen werden');
        }
        const data = await response.json();
        const doc = data?.docs?.[0];

        if (doc) {
          if (mounted) {
            const normalized = normalizeOrganization(doc);
            setOrganization(normalized);
            setInitialOrganization(normalized);
          }
        } else {
          const createResponse = await fetch(buildApiUrl('/api/organizations'), {
            method: 'POST',
            credentials: 'include',
            headers: withAuthHeaders({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              name: user.name || 'Neue Organisation',
              email: user.email,
              contactPerson: user.name,
            }),
          });

          if (!createResponse.ok) {
            throw new Error('Organisation konnte nicht erstellt werden');
          }
          const created = await createResponse.json();
          if (mounted) {
            const normalized = normalizeOrganization(created);
            setOrganization(normalized);
            setInitialOrganization(normalized);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden');
        }
      } finally {
        mounted && setLoading(false);
      }
    };

    loadOrganization();

    return () => {
      mounted = false;
    };
  }, [ownerQuery, user, normalizeOrganization]);

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

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Organisation …</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                E-Mail-Adresse
                <input
                  type="email"
                  value={organization.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Kontaktperson
                <input
                  value={organization.contactPerson}
                  onChange={(event) => handleChange('contactPerson', event.target.value)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Telefon
                <input
                  value={organization.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 md:col-span-2">
                Webseite
                <input
                  value={organization.website}
                  onChange={(event) => handleChange('website', event.target.value)}
                  placeholder="https://"
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
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
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Hausnummer
                <input
                  value={organization.address.number}
                  onChange={(event) => handleAddressChange('number', event.target.value)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                PLZ
                <input
                  value={organization.address.postalCode}
                  onChange={(event) => handleAddressChange('postalCode', event.target.value)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Stadt
                <input
                  value={organization.address.city}
                  onChange={(event) => handleAddressChange('city', event.target.value)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                />
              </label>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
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
        </form>
      )}
    </div>
  );
};

export default OrganizationProfilePage;
