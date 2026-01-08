import { buildApiUrl } from './baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

/**
 * List organizations the current user has access to.
 * Admins see all orgs, others see only their own.
 */
export async function listMyOrganizations() {
  const response = await fetch(buildApiUrl('/api/organizations?limit=100&sort=name'), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Organisationen konnten nicht geladen werden');
  }

  return response.json();
}

/**
 * List all organizations (admin only).
 */
export async function listAllOrganizations({ limit = 200, sort = 'name' } = {}) {
  const params = new URLSearchParams({ limit: String(limit), sort });
  const response = await fetch(buildApiUrl(`/api/organizations?${params.toString()}`), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Organisationen konnten nicht geladen werden');
  }

  return response.json();
}

/**
 * Get a single organization by ID.
 */
export async function getOrganization(id) {
  const response = await fetch(buildApiUrl(`/api/organizations/${id}`), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Organisation konnte nicht geladen werden');
  }

  return response.json();
}

/**
 * Create a new organization.
 * Organizations start as unapproved and must be approved by admin/editor.
 */
export async function createOrganization(data) {
  const response = await fetch(buildApiUrl('/api/organizations'), {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Organisation konnte nicht erstellt werden');
  }

  return response.json();
}

/**
 * Update an existing organization.
 */
export async function updateOrganization(id, data) {
  const response = await fetch(buildApiUrl(`/api/organizations/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Organisation konnte nicht aktualisiert werden');
  }

  return response.json();
}

/**
 * Request membership to an organization.
 */
export async function requestMembership(organizationId, message = '') {
  const response = await fetch(buildApiUrl('/api/organizations/request-membership'), {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ organizationId, message }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Mitgliedschaftsanfrage konnte nicht gesendet werden');
  }

  return response.json();
}

/**
 * Handle (approve/reject) a membership request.
 * Only available for admin/editor.
 */
export async function handleMembershipRequest(organizationId, userId, action) {
  const response = await fetch(buildApiUrl('/api/organizations/handle-membership'), {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ organizationId, userId, action }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Mitgliedschaftsanfrage konnte nicht bearbeitet werden');
  }

  return response.json();
}
