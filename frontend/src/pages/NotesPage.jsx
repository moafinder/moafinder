import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buildApiUrl } from '../api/baseUrl'

const NotesPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch(buildApiUrl('/api/notes'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      credentials: 'include',
    })
    if (res.ok) {
      setMessage('Note saved!')
      setContent('')
    } else {
      setMessage('Failed to save')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Create Note</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border p-2"
          required
        />
        <button type="submit" className="bg-[#7CB92C] text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}

export default NotesPage
