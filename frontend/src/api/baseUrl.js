const rawBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''

let sanitizedBaseUrl = ''

if (typeof rawBaseUrl === 'string') {
  const trimmed = rawBaseUrl.trim()

  if (trimmed) {
    try {
      const parsed = new URL(trimmed)
      // Drop trailing slashes to avoid double separators when we join paths.
      parsed.pathname = parsed.pathname.replace(/\/+$/, '')
      sanitizedBaseUrl = parsed.toString().replace(/\/+$/, '')
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('VITE_API_BASE_URL is not a valid absolute URL. Falling back to relative /api requests.', error)
      }
    }
  }
}

export const apiBaseUrl = sanitizedBaseUrl

if (
  typeof window !== 'undefined' &&
  window.location &&
  window.location.origin &&
  sanitizedBaseUrl === '' &&
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.MODE === 'production'
) {
  console.warn(
    'VITE_API_BASE_URL is empty; frontend requests will target the current origin. Ensure Amplify exports VITE_API_BASE_URL so API calls reach App Runner.'
  )
}

export function buildApiUrl(path = '') {
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!sanitizedBaseUrl) {
    return normalizedPath || '/'
  }

  try {
    return new URL(normalizedPath || '/', `${sanitizedBaseUrl}/`).toString()
  } catch (error) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Failed to build API URL, falling back to string concatenation.', error)
    }
    return `${sanitizedBaseUrl}${normalizedPath}`
  }
}
