import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createOrganization } from '../../api/organizations';
import { HelpSection } from '../../components/HelpTooltip';

const emptyForm = {
  name: '',
  email: '',
  contactPerson: '',
  phone: '',
  website: '',
  address: {
    street: '',
    number: '',
    postalCode: '',
    city: 'Berlin',
  },
};

const OrganizationCreatePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.name.trim()) {
      setError('Der Name der Organisation ist erforderlich.');
      return;
    }
    if (!form.email.trim()) {
      setError('Die E-Mail-Adresse ist erforderlich.');
      return;
    }

    try {
      setSaving(true);
      await createOrganization({
        name: form.name.trim(),
        email: form.email.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        address: {
          street: form.address.street.trim() || undefined,
          number: form.address.number.trim() || undefined,
          postalCode: form.address.postalCode.trim() || undefined,
          city: form.address.city.trim() || 'Berlin',
        },
      });
      navigate('/dashboard/organization', {
        state: { message: 'Organisation wurde erstellt und wartet auf Freigabe.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Organisation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Dashboard</p>
        <h1 className="text-3xl font-bold text-gray-900">Neue Organisation erstellen</h1>
        <p className="text-sm text-gray-600">
          Erstelle eine neue Organisation, um Veranstaltungen und Orte zu verwalten.
        </p>
      </header>

      <HelpSection title="Wie funktioniert die Organisationserstellung?">
        <div className="space-y-3">
          <div>
            <strong className="text-blue-800">Was ist eine Organisation?</strong>
            <p className="mt-1">Eine Organisation repräsentiert einen Verein, eine Initiative oder einen Veranstalter in Moabit. Sie ist die Grundlage für das Erstellen von Veranstaltungen und Orten.</p>
          </div>
          <div>
            <strong className="text-blue-800">Schritt-für-Schritt:</strong>
            <ol className="mt-1 ml-4 list-decimal space-y-1">
              <li><strong>Grunddaten ausfüllen:</strong> Name und E-Mail sind Pflichtfelder.</li>
              <li><strong>Kontaktdaten ergänzen:</strong> Kontaktperson und Telefon helfen bei Rückfragen.</li>
              <li><strong>Adresse angeben:</strong> Optional, aber hilfreich für die Zuordnung.</li>
              <li><strong>Absenden:</strong> Die Organisation wird zur Prüfung eingereicht.</li>
            </ol>
          </div>
          <div>
            <strong className="text-blue-800">Freigabeprozess:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Neue Organisationen müssen von der <strong>Redaktion freigegeben</strong> werden.</li>
              <li>Erst nach Freigabe kannst du Veranstaltungen erstellen, die öffentlich sichtbar sind.</li>
              <li>Du wirst automatisch als <strong>Eigentümer</strong> der Organisation eingetragen.</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Was wird geprüft?</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Ist die Organisation real und in Moabit aktiv?</li>
              <li>Sind die Kontaktdaten vollständig und plausibel?</li>
              <li>Gibt es bereits einen Eintrag für diese Organisation?</li>
            </ul>
          </div>
          <div className="mt-2 rounded bg-blue-100 p-2">
            <strong className="text-blue-800">Tipp:</strong>
            <span className="ml-1">Bereits existierende Organisation? Nutze "Organisationen durchsuchen", um eine Mitgliedschaft anzufragen.</span>
          </div>
        </div>
      </HelpSection>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Grunddaten</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name der Organisation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="z.B. Stadtteilzentrum Moabit"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                E-Mail-Adresse <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="kontakt@organisation.de"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kontaktperson
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="+49 30 12345678"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Webseite
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="https://www.organisation.de"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Adresse (optional)</h2>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Straße
              </label>
              <input
                type="text"
                value={form.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="Musterstraße"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hausnummer
              </label>
              <input
                type="text"
                value={form.address.number}
                onChange={(e) => handleAddressChange('number', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="42"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                PLZ
              </label>
              <input
                type="text"
                value={form.address.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="10551"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stadt
              </label>
              <input
                type="text"
                value={form.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                placeholder="Berlin"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <Link
            to="/dashboard/organization"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#7CB92C] px-6 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-50"
          >
            {saving ? 'Wird erstellt …' : 'Organisation erstellen'}
          </button>
        </div>
      </form>

      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <strong>Hinweis:</strong> Nach dem Erstellen muss die Organisation von der Redaktion freigegeben werden.
        Du erhältst eine Benachrichtigung, sobald die Freigabe erfolgt ist.
      </div>
    </div>
  );
};

export default OrganizationCreatePage;
