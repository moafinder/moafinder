import { buildApiUrl } from './baseUrl';

const API_URL = '/api/media';

async function request(url, options = {}) {
  const response = await fetch(buildApiUrl(url), {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Medienanfrage fehlgeschlagen');
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return null;
}

export async function listMedia(params = {}) {
  const search = new URLSearchParams(params);
  return request(`${API_URL}?${search.toString()}`);
}

export async function deleteMedia(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}

