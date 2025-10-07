import { buildApiUrl } from './baseUrl';

export async function listLocations({ limit = 200 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(buildApiUrl(`/api/locations?${params.toString()}`), {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Konnte Orte nicht laden');
  }
  return response.json();
}

