import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { buildApiUrl } from '../api/baseUrl'
import { withAuthHeaders } from '../utils/authHeaders'

const AuthContext = createContext(null)

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const inactivityTimer = useRef(null)
  const logoutRef = useRef(null)

  // Clear local session without calling server (for auto-logout scenarios)
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
    } catch {/* ignore */}
    setUser(null)
    setToken(null)
  }, [])

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    // Only set timer if user is logged in
    if (logoutRef.current) {
      inactivityTimer.current = setTimeout(() => {
        console.log('Session expired due to inactivity')
        if (logoutRef.current) logoutRef.current()
      }, SESSION_TIMEOUT_MS)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const storedToken = localStorage.getItem('authToken')
      if (stored) {
        setUser(JSON.parse(stored))
      }
      if (storedToken) {
        setToken(storedToken)
      }
    } catch (error) {
      console.warn('Failed to load stored user', error)
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
    } finally {
      setInitializing(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await fetch(buildApiUrl('/api/users/login'), {
      method: 'POST',
      headers: withAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Login failed')
    }

    const data = await res.json()
    setUser(data.user)
    setToken(data.token ?? null)
    localStorage.setItem('user', JSON.stringify(data.user))
    if (data.token) {
      localStorage.setItem('authToken', data.token)
    } else {
      localStorage.removeItem('authToken')
    }
    // Start inactivity timer after login
    resetInactivityTimer()
  }

  const logout = async () => {
    // Clear inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }
    try {
      await fetch(buildApiUrl('/api/users/logout'), {
        method: 'POST',
        credentials: 'include',
        headers: withAuthHeaders(),
      })
    } catch (err) {
      // Network/CORS errors should not prevent local sign-out
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Logout request failed; clearing local session anyway.', err)
      }
    } finally {
      clearSession()
    }
  }

  // Keep logoutRef in sync so the timer callback can call it
  useEffect(() => {
    logoutRef.current = logout
  })

  // Set up activity listeners to reset inactivity timer
  useEffect(() => {
    if (!user) return

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']
    const handleActivity = () => resetInactivityTimer()

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Start timer when user is set
    resetInactivityTimer()

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
    }
  }, [user, resetInactivityTimer])

  // Authenticated fetch helper that auto-logouts on 401/403
  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: withAuthHeaders(options.headers || {}),
    })
    if (res.status === 401 || res.status === 403) {
      console.warn('Session expired or unauthorized, logging out')
      clearSession()
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1'
      }
      throw new Error('Session expired')
    }
    // Reset inactivity timer on successful authenticated request
    resetInactivityTimer()
    return res
  }, [clearSession, resetInactivityTimer])

  return <AuthContext.Provider value={{ user, token, login, logout, authFetch, clearSession, initializing }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
