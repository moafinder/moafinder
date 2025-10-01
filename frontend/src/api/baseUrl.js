const rawBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
const normalizedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/+$/, '') : ''

export const apiBaseUrl = normalizedBaseUrl

export function buildApiUrl(path = '') {
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!normalizedBaseUrl) {
    return normalizedPath
  }

  return `${normalizedBaseUrl}${normalizedPath}`
}
