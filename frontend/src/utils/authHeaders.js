function getAuthToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('authToken')
    }
  } catch (error) {
    console.warn('Unable to access auth token in localStorage', error)
  }
  return null
}

function getCsrfToken() {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
    return null
  }

  const match = document.cookie.match(/(?:^|;\s*)payload-csrf-token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function withAuthHeaders(headers = {}) {
  const merged = { ...headers }

  const authToken = getAuthToken()
  if (authToken) {
    const hasAuthHeader = Object.keys(merged).some((key) => key.toLowerCase() === 'authorization')
    if (!hasAuthHeader) {
      merged.Authorization = `Bearer ${authToken}`
    }
  }

  const csrfToken = getCsrfToken()
  if (csrfToken) {
    const hasCsrfHeader = Object.keys(merged).some((key) => key.toLowerCase() === 'payload-csrf-token')
    if (!hasCsrfHeader) {
      merged['Payload-CSRF-Token'] = csrfToken
    }
  }

  // Browsers strip custom headers on credentials requests unless they appear on the allowlist.
  // When CORS is not configured to accept X-Media-Alt, send the alt text in FormData instead.
  delete merged['X-Media-Alt']

  return merged
}
