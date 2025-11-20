import React, { createContext, useContext, useEffect, useState } from 'react'
import { buildApiUrl } from '../api/baseUrl'
import { withAuthHeaders } from '../utils/authHeaders'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)

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
  }

  const logout = async () => {
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
      try {
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
      } catch {/* ignore */}
      setUser(null)
      setToken(null)
    }
  }

  return <AuthContext.Provider value={{ user, token, login, logout, initializing }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
