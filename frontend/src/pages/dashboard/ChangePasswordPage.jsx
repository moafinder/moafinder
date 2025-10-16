import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../api/users';

const ChangePasswordPage = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return <p className="text-sm text-gray-600">Bitte melde dich an.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 12) {
      setError('Das Passwort muss mindestens 12 Zeichen enthalten.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Passwort benötigt Groß-, Kleinbuchstaben, Zahl und Sonderzeichen.');
      return;
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    try {
      setSaving(true);
      await updateUser(user.id, { password });
      setPassword('');
      setConfirm('');
      setSuccess('Passwort wurde aktualisiert.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Konto</p>
        <h1 className="text-3xl font-bold text-gray-900">Passwort ändern</h1>
        <p className="text-sm text-gray-600">Sichere dein Konto mit einem starken Passwort.</p>
      </header>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="flex flex-col text-sm font-medium text-gray-700">
          Neues Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-gray-700">
          Neues Passwort bestätigen
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
          />
        </label>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#7CB92C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#5a8b20] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Speichert …' : 'Passwort aktualisieren'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;

