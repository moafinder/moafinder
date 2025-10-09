import { buildApiUrl } from './baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

const API_URL = '/api/events';

async function request(url, options = {}) {
  const { headers: providedHeaders, ...rest } = options;
  const response = await fetch(buildApiUrl(url), {
    credentials: 'include',
    headers: withAuthHeaders(providedHeaders || {}),
    ...rest,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Event request failed');
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return null;
}

export async function listEvents(params = {}) {
  const search = new URLSearchParams(params);
  return request(`${API_URL}?${search.toString()}`);
}

export async function getEvent(id, params = {}) {
  const search = new URLSearchParams(params);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return request(`${API_URL}/${id}${suffix}`);
}

export async function createEvent(data) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return request(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return request(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
}
