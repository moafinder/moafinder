import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import kiezMachenLogo from '../assets/kiezmachen_logo.png';
import refoLogo from '../assets/refo_logo.png';
import partnerLogos from '../assets/partner_logos.png';

/**
 * Login page matching the Figma design.
 * Features:
 * - Email and password input fields
 * - Green login button (#7CB92C)
 * - Link to registration page
 * - Password recovery link
 * - Partner logos at the bottom
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Bitte geben Sie Ihre Zugangsdaten ein.');
      return;
    }
    
    // TODO: Replace with real authentication
    console.log('Login attempt:', { email, password });
    
    // Simulate successful login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-8 text-center">
            Login für Veranstalter*innen
          </h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB92C] focus:border-transparent transition-all duration-300"
                placeholder="email@veranstalterin.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                MoaFinder Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB92C] focus:border-transparent transition-all duration-300 pr-12"
                  placeholder="**************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#7CB92C] text-white font-bold py-3 px-4 rounded-md hover:bg-[#5a8b20] transition-all duration-300 transform hover:scale-[1.02]"
            >
              Login
            </button>

            {/* Password Recovery Link */}
            <div className="text-center">
              <a 
                href="google.com" 
                className="text-[#7CB92C] hover:text-[#5a8b20] text-sm font-medium transition-colors duration-300"
              >
                Passwort vergessen?
              </a>
            </div>
          </form>

          {/* Registration Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 font-semibold mb-4">Neu bei MoaFinder?</p>
              <Link
                to="/register"
                className="inline-block px-6 py-3 bg-white border-2 border-black text-black font-bold rounded-md hover:bg-[#7CB92C] hover:text-white hover:border-[#7CB92C] transition-all duration-300"
              >
                Registrieren
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Logos Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">Dies ist ein Kooperationsprojekt von:</p>
          <div className="flex justify-center items-center space-x-8 mb-8">
            <a 
              href="https://moabiter-ratschlag.de/orte/kiez-machen-mobile-stadtteilarbeit-in-moabit/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity duration-300"
            >
              <img src={kiezMachenLogo} alt="Kiez Machen" className="h-16" />
            </a>
            <a 
              href="https://www.refo-moabit.de/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity duration-300"
            >
              <img src={refoLogo} alt="REFO" className="h-16" />
            </a>
          </div>
          
          <p className="text-gray-600 mb-4">Der MoaFinder wurde gefördert durch:</p>
          <img 
            src={partnerLogos} 
            alt="Förderer" 
            className="mx-auto max-w-4xl w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;