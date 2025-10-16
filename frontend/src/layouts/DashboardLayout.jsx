import React from 'react';
import { apiBaseUrl } from '../api/baseUrl';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const primaryNav = [
  { label: 'Profil', to: '/dashboard', role: 'any' },
  { label: 'Redaktion', to: '/dashboard/editor', role: 'editor' },
  { label: 'Admin', to: '/dashboard/admin', role: 'admin' },
];

const organizerSidebar = [
  { label: 'Veranstaltungsorte', to: '/dashboard/places' },
  { label: 'Profil der Organisation', to: '/dashboard/organization' },
  { label: 'Angebote/Veranstaltungen', to: '/dashboard/events' },
  { label: 'Event-Bilder', to: '/dashboard/media' },
  { label: 'Regelkatalog', to: '/dashboard/guidelines' },
  { label: 'Archiv', to: '/dashboard/archive' },
  { label: 'Passwort ändern', to: '/dashboard/password' },
];

const editorSidebar = [
  { label: 'Veranstaltungsorte', to: '/dashboard/editor/places' },
  { label: 'Profile der Organisationen', to: '/dashboard/editor/organizations' },
  { label: 'Angebote/Veranstaltungen', to: '/dashboard/editor/events' },
  { label: 'Event-Bilder', to: '/dashboard/editor/media' },
  { label: 'Regelkatalog', to: '/dashboard/editor/guidelines' },
  { label: 'Archiv', to: '/dashboard/editor/archive' },
  { label: 'Passwort ändern', to: '/dashboard/password' },
];

const adminSidebar = [
  { label: 'Systemübersicht', to: '/dashboard/admin' },
  { label: 'Benutzerverwaltung', to: '/dashboard/admin/users' },
  { label: 'Einstellungen', to: '/dashboard/admin/settings' },
  { label: 'Passwort ändern', to: '/dashboard/password' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role ?? 'organizer';
  const sidebarItems = role === 'admin' ? adminSidebar : role === 'editor' ? editorSidebar : organizerSidebar;

  const canSee = (navRole) => {
    if (navRole === 'any') return true;
    if (navRole === 'editor' && (role === 'editor' || role === 'admin')) return true;
    if (navRole === 'admin' && role === 'admin') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-black text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center space-x-8">
            <span className="text-lg font-semibold tracking-tight">MoaFinder</span>
            <nav className="hidden space-x-6 md:flex">
              {primaryNav.filter((item) => canSee(item.role)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-semibold transition-colors ${
                      isActive ? 'text-[#7CB92C]' : 'text-white hover:text-[#7CB92C]'
                    }`
                  }
                  end
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <a
                href={`${(apiBaseUrl || '').replace(/\/?api$/, '') || ''}/admin`}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-md border border-gray-700 px-3 py-1 text-sm font-semibold text-gray-200 transition hover:bg-gray-800 md:inline"
                title="Payload Admin öffnen"
              >
                Payload Admin
              </a>
            )}
            {user && (
              <span className="hidden text-sm text-gray-300 md:inline">{user.email}</span>
            )}
            <button
              onClick={logout}
              className="rounded-md border border-transparent bg-[#7CB92C] px-3 py-1 text-sm font-semibold text-black transition hover:bg-[#5a8b20]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row">
          <aside className="w-full text-sm font-semibold text-gray-800 md:w-56 md:flex-none">
            <nav className="space-y-3">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block transition ${
                      isActive || location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                        ? 'text-[#7CB92C]'
                        : 'text-gray-800 hover:text-[#7CB92C]'
                    }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>

      <footer className="mt-8 border-t border-gray-200 bg-white py-6 text-sm text-gray-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} MoaFinder</span>
          <div className="flex space-x-4">
            <a href="/datenschutz" className="hover:text-[#7CB92C]">
              Datenschutz
            </a>
            <a href="/impressum" className="hover:text-[#7CB92C]">
              Impressum
            </a>
            <a href="mailto:moafinder@moabit.world" className="hover:text-[#7CB92C]">
              moafinder@moabit.world
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
