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
          className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to project
        </Link>
        <h1 className="text-3xl font-bold text-white mt-3 tracking-tight">Add secret</h1>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Key name</label>
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value.toUpperCase())}
              required
              className="glass-input w-full font-mono"
              placeholder="DATABASE_PASSWORD"
            />
            <p className="text-gray-600 text-xs mt-1">Keys are automatically uppercased</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Secret value</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              rows={4}
              className="glass-input w-full font-mono resize-none"
              placeholder="Enter the secret value..."
            />
            <p className="text-gray-600 text-xs mt-1 inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Encrypted with AES-256-GCM before storage
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full"
              placeholder="What is this secret for?"
            />
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="inline-flex items-center gap-2"><span className="spinner" /> Saving...</span> : 'Save secret'}
            </button>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-gray-400 hover:text-white rounded-xl px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
