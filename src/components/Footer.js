import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebookF,
  faInstagram,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import pigeonWhite from '../assets/pigeon_white.png';
import footerImage from '../assets/footer.png';
import kiezmachenLogo from '../assets/kiezmachen_logo.png';
import refoLogo from '../assets/refo_logo.png';

const Footer = () => (
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
            Turmstraße 75<br />
            10555 Berlin
          </p>
          <p className="mt-2">
            Telefon:{' '}
            <a href="tel:+493012345678" className="text-primary-700 hover:underline">
              030 123 456 78
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:info@moafinder.de" className="text-primary-700 hover:underline">
              info@moafinder.de
            </a>
          </p>
        </div>
        
        {/* Navigation section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Navigation</h2>
          <ul className="space-y-1">
            <li>
              <Link to="/" className="text-gray-700 hover:text-primary-700">
                Orte
              </Link>
            </li>
            <li>
              <Link to="/entries" className="text-gray-700 hover:text-primary-700">
                Einträge
              </Link>
            </li>
            <li>
              <Link to="/formats" className="text-gray-700 hover:text-primary-700">
                Formate
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-gray-700 hover:text-primary-700">
                Kontakt
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-gray-700 hover:text-primary-700">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-gray-700 hover:text-primary-700">
                Registrieren
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Social media section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Folgen Sie uns</h2>
          <div className="flex space-x-4 text-lg">
            <a href="https://facebook.com" aria-label="Facebook" className="text-gray-700 hover:text-primary-700">
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="text-gray-700 hover:text-primary-700">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://twitter.com" aria-label="Twitter" className="text-gray-700 hover:text-primary-700">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
          </div>
          <p className="mt-4 text-xs">
            © {new Date().getFullYear()} MoaFinder. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </div>
    
{/* Cooperation partners section - WHITE BACKGROUND */}
<div className="bg-white py-4">
  <div className="container mx-auto px-4">
    <p className="text-black text-xs mb-2">Dies ist ein Kooperationsprojekt von:</p>
    <div className="flex space-x-4 mb-4">
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

    
    {/* Bottom row with legal links - BLACK BACKGROUND */}
    <div className="bg-black border-t border-gray-700 py-2 text-center text-xs">
      <Link to="/datenschutz" className="footer-link">Datenschutz</Link>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <Link to="/impressum" className="footer-link">Impressum</Link>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <a href="mailto:moafinder@moabit.world" className="footer-link">moafinder@moabit.world</a>
    </div>
  </footer>
);

export default Footer;