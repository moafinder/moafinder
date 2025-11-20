import { buildApiUrl } from './baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

function createSearchParams(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          search.append(key, String(item));
        }
      });
    } else {
      search.append(key, String(value));
    }
  });
  return search;
}

export async function listLocations({ limit = 200, ...rest } = {}) {
  const params = createSearchParams({ limit, ...rest });
  const response = await fetch(buildApiUrl(`/api/locations?${params.toString()}`), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Konnte Orte nicht laden');
  }
  return response.json();
}

export async function getLocation(id, params = {}) {
  if (!id) {
    throw new Error('Es muss eine Orts-ID angegeben werden.');
  }
  const search = createSearchParams(params);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const response = await fetch(buildApiUrl(`/api/locations/${id}${suffix}`), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Konnte Ort nicht laden');
  }
  return response.json();
}

export async function createLocation(data) {
  const response = await fetch(buildApiUrl('/api/locations'), {
    method: 'POST',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Ort konnte nicht erstellt werden.');
  }
  return response.json();
}

export async function updateLocation(id, data) {
  const response = await fetch(buildApiUrl(`/api/locations/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Ort konnte nicht aktualisiert werden.');
  }
  return response.json();
}

export async function deleteLocation(id) {
  if (!id) throw new Error('Es muss eine Orts-ID angegeben werden.');
  const response = await fetch(buildApiUrl(`/api/locations/${id}`), {
    method: 'DELETE',
    credentials: 'include',
    headers: withAuthHeaders(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Ort konnte nicht gelöscht werden.');
  }
  return true;
}
