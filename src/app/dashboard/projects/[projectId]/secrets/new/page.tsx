'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NewSecretPage() {
  const router = useRouter()
  const { projectId } = useParams<{ projectId: string }>()
  const [keyName, setKeyName] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        key_name: keyName,
        value,
        description,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Back to project
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">Add secret</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Key name</label>
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value.toUpperCase())}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              placeholder="DATABASE_PASSWORD"
            />
            <p className="text-gray-600 text-xs mt-1">Keys are automatically uppercased</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Secret value</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Enter the secret value..."
            />
            <p className="text-gray-600 text-xs mt-1">Encrypted with AES-256-GCM before storage</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="What is this secret for?"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save secret'}
            </button>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-gray-400 hover:text-white rounded px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
