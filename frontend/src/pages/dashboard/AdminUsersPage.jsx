import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, updateUser } from '../../api/users';

const roleOptions = [
  { value: 'organizer', label: 'Organizer' },
  { value: 'editor', label: 'Redaktion' },
  { value: 'admin', label: 'Admin' },
];

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listUsers({ limit: 200 });
        if (mounted) setUsers(Array.isArray(data.docs) ? data.docs : []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Benutzer konnten nicht geladen werden');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    return users.filter((user) => `${user.name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setProcessingId(userId);
      await updateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollenzuweisung fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Admin</p>
        <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <p className="text-sm text-gray-600">Verwalte Rollen und Zugänge. Änderungen wirken sofort.</p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">{users.length} Benutzer*innen</div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name oder E-Mail suchen …"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] md:w-72"
        />
      </div>

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Benutzer …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">E-Mail</th>
                <th className="px-4 py-3 text-left">Rolle</th>
                <th className="px-4 py-3 text-left">Erstellt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{user.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.role}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                      disabled={processingId === user.id}
                      className="rounded-md border border-gray-300 px-2 py-1 focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
