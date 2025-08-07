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

/**
 * Footer component. Provides links to informational pages and
 * displays contact details and social media icons. This footer
 * stays at the bottom of the viewport if content is short due to
 * the flex container defined in App.js.
 */
const Footer = () => (
  <footer className="bg-black text-white mt-12">
    <div className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
      <div>
        <img src={pigeonWhite} alt="MoaFinder Logo" className="h-8 w-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
        <p>
          MoaFinder
          <br />
          Turmstraße 75
          <br />
          10555 Berlin
        </p>
        <p className="mt-2">
          Telefon:{' '}
          <a href="tel:+493012345678" className="footer-link">
            030 123 456 78
          </a>
        </p>
        <p>
          Email:{' '}
          <a href="mailto:info@moafinder.de" className="footer-link">
            info@moafinder.de
          </a>
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Navigation</h2>
        <ul className="space-y-1">
          <li>
            <Link to="/" className="footer-link">
              Orte
            </Link>
          </li>
          <li>
            <Link to="/entries" className="footer-link">
              Einträge
            </Link>
          </li>
          <li>
            <Link to="/formats" className="footer-link">
              Formate
            </Link>
          </li>
          <li>
            <Link to="/contact" className="footer-link">
              Kontakt
            </Link>
          </li>
          <li>
            <Link to="/login" className="footer-link">
              Login
            </Link>
          </li>
          <li>
            <Link to="/register" className="footer-link">
              Registrieren
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Folgen Sie uns</h2>
        <div className="flex space-x-4 text-lg">
          <a href="https://facebook.com" aria-label="Facebook" className="footer-link">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://instagram.com" aria-label="Instagram" className="footer-link">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://twitter.com" aria-label="Twitter" className="footer-link">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
        </div>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} MoaFinder. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
    {/* Logos of cooperation projects and sponsors */}
    <div className="bg-black py-4">
      <div className="container mx-auto px-4">
        <img
          src={footerImage}
          alt="Kooperationspartner und Förderer"
          className="w-full h-auto mx-auto"
        />
      </div>
    </div>
    {/* Bottom row with legal links */}
    <div className="bg-black border-t border-gray-700 py-2 text-center text-xs">
      Datenschutz&nbsp;&nbsp;|&nbsp;&nbsp;Impressum&nbsp;&nbsp;|&nbsp;&nbsp;
      <a href="mailto:moafinder@moabit.world" className="footer-link">
        moafinder@moabit.world
      </a>
    </div>
  </footer>
);

export default Footer;