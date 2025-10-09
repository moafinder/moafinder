import { buildApiUrl } from './baseUrl';
import { withAuthHeaders } from '../utils/authHeaders';

export async function listTags({ limit = 200 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(buildApiUrl(`/api/tags?${params.toString()}`), {
    credentials: 'include',
    headers: withAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Konnte Tags nicht laden');
  }
  return response.json();
}
