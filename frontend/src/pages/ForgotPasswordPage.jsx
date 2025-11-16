import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../api/baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/users/forgot-password'), {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      // Payload returns 200 regardless to avoid user enumeration in most setups; treat non-200 as soft success too
      if (!res.ok) {
        // Try to parse and show friendlier error, but don't leak server messages
        try {
          const body = await res.json();
          const msg = body?.errors?.[0]?.message || body?.message || '';
          if (msg && /not.*found|unknown/i.test(msg)) {
            // Don't reveal existence of accounts
              /* noop */
          }
        } catch {}
      }
      setSuccess(true);
    } catch (err) {
      setError('Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Passwort zurücksetzen</h1>
      {success ? (
        <div className="space-y-4">
          <p className="text-gray-700">
            Wenn ein Konto mit <strong>{email}</strong> existiert, haben wir einen Link zum Zurücksetzen des Passworts per E‑Mail gesendet.
          </p>
          <p className="text-sm text-gray-600">
            Keine E‑Mail erhalten? Prüfe den Spam‑Ordner oder kontaktiere uns unter{' '}
            <a href="mailto:moafinder@moabit.world" className="text-[#7CB92C] hover:underline">moafinder@moabit.world</a>.
          </p>
          <Link to="/login" className="text-[#7CB92C] hover:underline font-semibold">← Zurück zum Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            E‑Mail-Adresse
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-70"
          >
            {submitting ? 'Wird gesendet …' : 'Link anfordern'}
          </button>
          <div>
            <Link to="/login" className="text-[#7CB92C] hover:underline">Zurück zum Login</Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;

