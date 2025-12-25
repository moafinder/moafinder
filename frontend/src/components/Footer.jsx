import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebookF,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import pigeonWhite from '../assets/pigeon_white.png';
import footerImage from '../assets/footer.png';
import kiezmachenLogo from '../assets/kiezmachen_logo.png';
import refoLogo from '../assets/refo_logo.png';

const Footer = () => {
  const { user } = useAuth();

  const navigationLinks = [
    { label: 'Events', to: '/formate' },
    { label: 'Orte', to: '/orte' },
    { label: 'Einträge', to: '/events' },
    { label: 'Kontakt', to: '/kontakt' },
  ];

  const authLinks = user
    ? [{ label: 'Dashboard', to: '/dashboard' }]
    : [
        { label: 'Login', to: '/login' },
        { label: 'Registrieren', to: '/register' },
      ];

  return (
    <footer className="mt-12">
      {/* Main footer content - white background */}
      <div className="bg-white text-gray-800 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
          {/* Contact section */}
          <div>
            <img src={pigeonWhite} alt="MoaFinder Logo" className="h-8 w-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
            <p>
              MoaFinder<br />
              Wiclefstraße 32<br />
              10551 Berlin
            </p>
            <p className="mt-2">
              Email:{' '}
              <a href="mailto:moafinder@moabit.world" className="text-brand hover:underline">
                moafinder@moabit.world
              </a>
            </p>
          </div>

          {/* Navigation section */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Navigation</h2>
            <ul className="space-y-1">
              {navigationLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-gray-700 hover:text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
              {authLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-gray-700 hover:text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

{/* Social media section - hidden for now */}
          {/*
          <div>
            <h2 className="text-lg font-semibold mb-2">Folgen Sie uns</h2>
            <div className="flex space-x-4 text-lg">
              <a href="https://www.instagram.com/moabit.world/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-700 hover:text-brand">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="https://www.facebook.com/moabit.world/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-700 hover:text-brand">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
            </div>
            <p className="mt-4 text-xs">
              © {new Date().getFullYear()} MoaFinder. Alle Rechte vorbehalten.
            </p>
          </div>
          */}
        </div>
      </div>

      {/* Cooperation partners section - white background */}
      <div className="bg-white py-4">
        <div className="container mx-auto px-4">
          <p className="text-black text-xs mb-2">Dies ist ein Kooperationsprojekt von:</p>
          <div className="flex space-x-4 mb-4">
            {/* Kiez Machen logo hidden for now
            <a
              href="https://moabiter-ratschlag.de/orte/kiez-machen-mobile-stadtteilarbeit-in-moabit/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={kiezmachenLogo}
                alt="Kiez Machen"
                className="h-12 hover:opacity-80 transition-opacity"
              />
            </a>
            */}
            <a
              href="https://www.refo-moabit.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={refoLogo}
                alt="REFO"
                className="h-12 hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
          <p className="text-black text-xs mb-2">Der MoaFinder wurde gefördert durch:</p>
          <img src={footerImage} alt="Förderer" className="w-full max-w-2xl h-auto" />
        </div>
      </div>

      {/* Bottom row with legal links - black background */}
      <div className="bg-black border-t border-gray-700 py-3 text-center text-xs">
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
          <Link to="/datenschutz" className="footer-link">Datenschutz</Link>
          <span className="text-gray-500">|</span>
          <Link to="/impressum" className="footer-link">Impressum</Link>
          <span className="text-gray-500">|</span>
          <a href="mailto:moafinder@moabit.world" className="footer-link">moafinder@moabit.world</a>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 flex items-center gap-1">
            <span role="img" aria-label="Sprache">🇩🇪</span> Diese Seite ist nur auf Deutsch verfügbar
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
