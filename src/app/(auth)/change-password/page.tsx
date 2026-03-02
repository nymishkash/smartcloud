'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Change password</h2>

      {message && (
        <div className="bg-green-900/30 border border-green-700 rounded p-3 text-green-300 text-sm mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded py-2 text-sm font-medium transition-colors"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
