import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Login page. Collects email/username and password, performs basic
 * client-side validation and simulates a successful login. Integrate
 * this form with your authentication API to implement real login.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Validate that both fields are filled in
    if (!email || !password) {
      setError('Bitte geben Sie Ihre Zugangsdaten ein.');
      return;
    }
    // TODO: replace with real authentication call
    // Simple simulation: log to console and redirect to home page
    console.log('Login with', email, password);
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Anmelden</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email oder Benutzername</label>
          <input
            type="text"
            id="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">Passwort</label>
          <input
            type="password"
            id="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-primary-700 text-white px-4 py-2 rounded hover:bg-primary-800 w-full"
        >
          Einloggen
        </button>
      </form>
      <p className="mt-4 text-sm">Noch kein Konto? <Link to="/register" className="text-primary-700 hover:underline">Registrieren</Link></p>
    </div>
  );
};

export default LoginPage;