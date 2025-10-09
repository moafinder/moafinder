import { buildApiUrl } from './baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

const API_URL = '/api/users';

async function request(url, options = {}) {
  const { headers: providedHeaders, ...rest } = options;
  const response = await fetch(buildApiUrl(url), {
    credentials: 'include',
    headers: withAuthHeaders(providedHeaders || {}),
    ...rest,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Benutzeranfrage fehlgeschlagen');
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return null;
}

export async function listUsers(params = {}) {
  const search = new URLSearchParams(params);
  return request(`${API_URL}?${search.toString()}`);
}

export async function updateUser(id, data) {
  return request(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
