'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/projects/${data.project.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
          ← Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">New project</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. production-api"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="What secrets does this project manage?"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
            <Link
              href="/dashboard"
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
