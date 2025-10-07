import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const primaryNav = [
  { label: 'Profil', to: '/dashboard', role: 'any' },
  { label: 'Redaktion', to: '/dashboard/editor', role: 'editor' },
  { label: 'Admin', to: '/dashboard/admin', role: 'admin' },
];

const organizerSidebar = [
  { label: 'Übersicht', to: '/dashboard' },
  { label: 'Meine Organisation', to: '/dashboard/organization' },
  { label: 'Veranstaltungen', to: '/dashboard/events' },
  { label: 'Medien', to: '/dashboard/media' },
  { label: 'Regelkatalog', to: '/dashboard/guidelines' },
];

const editorSidebar = [
  { label: 'Veranstaltungsorte', to: '/dashboard/editor/places' },
  { label: 'Profile der Organisationen', to: '/dashboard/editor/organizations' },
  { label: 'Angebote/Veranstaltungen', to: '/dashboard/editor/events' },
  { label: 'Event-Bilder', to: '/dashboard/editor/media' },
  { label: 'Regelkatalog', to: '/dashboard/editor/guidelines' },
  { label: 'Archiv', to: '/dashboard/editor/archive' },
];

const adminSidebar = [
  { label: 'Systemübersicht', to: '/dashboard/admin' },
  { label: 'Benutzerverwaltung', to: '/dashboard/admin/users' },
  { label: 'Einstellungen', to: '/dashboard/admin/settings' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

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

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="w-full rounded-lg bg-white p-4 shadow-sm md:w-64">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive || location.pathname === item.to
                      ? 'bg-[#E8F5DA] text-[#417225]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                end
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
