import React, { createContext, useContext, useEffect, useState } from 'react'
import { buildApiUrl } from '../api/baseUrl'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load stored user', error)
      localStorage.removeItem('user')
    } finally {
      setInitializing(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await fetch(buildApiUrl('/api/users/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Login failed')
    }

    const data = await res.json()
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = async () => {
    await fetch(buildApiUrl('/api/users/logout'), {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
