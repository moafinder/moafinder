import { buildApiUrl } from './baseUrl';

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
