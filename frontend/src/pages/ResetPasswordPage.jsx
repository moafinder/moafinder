import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buildApiUrl } from '../api/baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

const isStrong = (pw) => {
  if (!pw || pw.length < 12) return false;
  return /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Ungültiger oder fehlender Token.');
      return;
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (!isStrong(password)) {
      setError('Passwort muss mind. 12 Zeichen mit Groß‑/Kleinbuchstaben, Zahl und Sonderzeichen enthalten.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/users/reset-password'), {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        let message = 'Zurücksetzen fehlgeschlagen.';
        try {
          const body = await res.json();
          message = body?.errors?.[0]?.message || body?.message || message;
        } catch {}
        throw new Error(message);
      }
      navigate('/login', { replace: true, state: { message: 'Passwort aktualisiert. Bitte neu einloggen.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zurücksetzen fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Neues Passwort setzen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!token && (
          <p className="text-sm text-red-600">Der Link ist ungültig oder abgelaufen.</p>
        )}
        <label className="block text-sm font-medium text-gray-700">
          Neues Passwort
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Passwort bestätigen
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <p className="text-xs text-gray-500">Mindestens 12 Zeichen, Groß‑/Kleinbuchstaben, Zahl und Sonderzeichen.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !token}
          className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#5a8b20] disabled:opacity-70"
        >
          {submitting ? 'Speichert …' : 'Passwort speichern'}
        </button>
        <div>
          <Link to="/login" className="text-[#7CB92C] hover:underline">Zurück zum Login</Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;

