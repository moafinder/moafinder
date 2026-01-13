import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, updateUser, deleteUser } from '../../api/users';

const roleOptions = [
  { value: 'organizer', label: 'Organizer' },
  { value: 'editor', label: 'Redaktion' },
  { value: 'admin', label: 'Admin' },
];

const statusOptions = [
  { value: 'all', label: 'Alle Status' },
  { value: 'active', label: 'Aktiv' },
  { value: 'disabled', label: 'Deaktiviert' },
];

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState('');
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Delete confirmation state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    let result = users;
    
    // Text search
    if (search) {
      result = result.filter((user) => 
        `${user.name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((user) => 
        statusFilter === 'disabled' ? user.disabled : !user.disabled
      );
    }
    
    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter((user) => new Date(user.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((user) => new Date(user.createdAt) <= toDate);
    }
    
    return result;
  }, [users, search, roleFilter, statusFilter, dateFrom, dateTo]);

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

  const handleStatusChange = async (userId, disabled) => {
    try {
      setProcessingId(userId);
      await updateUser(userId, { disabled });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, disabled } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Statusänderung fehlgeschlagen');
    } finally {
      setProcessingId('');
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirmUser(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmUser) return;
    
    try {
      setDeleting(true);
      await deleteUser(deleteConfirmUser.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benutzer konnte nicht gelöscht werden');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmUser(null);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Admin</p>
        <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <p className="text-sm text-gray-600">Verwalte Rollen und Zugänge. Änderungen wirken sofort.</p>
      </header>

      {/* Filters Section */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Suche</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name oder E-Mail …"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            />
          </div>
          
          {/* Role Filter */}
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Rolle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            >
              <option value="all">Alle Rollen</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Date From */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Erstellt von</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            />
          </div>
          
          {/* Date To */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Erstellt bis</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
            />
          </div>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          {filtered.length} von {users.length} Benutzer*innen
          {hasActiveFilters && ' (gefiltert)'}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Benutzer löschen</h3>
            </div>
            
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-600">
                Möchtest du den Benutzer <strong className="text-gray-900">{deleteConfirmUser.email}</strong> wirklich löschen?
              </p>
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Der Benutzer wird dauerhaft gelöscht und verliert den Zugang zum System. 
                  Alle mit diesem Benutzer verknüpften Daten (z.B. hochgeladene Medien) bleiben erhalten, 
                  sind aber nicht mehr dem Benutzer zugeordnet.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Wird gelöscht …' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">Lade Benutzer …</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">E-Mail</th>
                  <th className="px-4 py-3 text-left">Rolle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Erstellt</th>
                  <th className="px-4 py-3 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Keine Benutzer gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{user.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          disabled={processingId === user.id}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0]"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.disabled ? 'disabled' : 'active'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value === 'disabled')}
                          disabled={processingId === user.id}
                          className={`rounded-md border px-2 py-1 text-sm focus:border-[#7CB92C] focus:outline-none focus:ring-2 focus:ring-[#C6E3A0] ${
                            user.disabled ? 'border-red-300 text-red-700' : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="active">Aktiv</option>
                          <option value="disabled">Deaktiviert</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString('de-DE')}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(user)}
                          disabled={processingId === user.id}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          title="Benutzer löschen"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
