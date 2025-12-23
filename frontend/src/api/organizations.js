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
