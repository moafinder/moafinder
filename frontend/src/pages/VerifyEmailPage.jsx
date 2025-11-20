import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../api/baseUrl';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Bestätige E‑Mail …');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Ungültiger Bestätigungslink.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/users/verify?token=${encodeURIComponent(token)}`));
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(data?.error || 'Verifikation fehlgeschlagen');
        setStatus('success');
        setMessage('E‑Mail erfolgreich bestätigt. Du wirst weitergeleitet …');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verifikation fehlgeschlagen');
      }
    })();
  }, [location.search, navigate]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-12">
      <div className={`rounded-xl border p-6 shadow-sm ${status === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <h1 className="text-2xl font-bold mb-2">E‑Mail‑Bestätigung</h1>
        <p className="text-sm">{message}</p>
        {status !== 'pending' && (
          <p className="mt-4 text-sm">
            Zur Anmeldung: <a href="/login" className="text-[#417225] hover:underline">Login</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

