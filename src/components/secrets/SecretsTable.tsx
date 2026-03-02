'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SecretMetadata } from '@/lib/types'

interface SecretsTableProps {
  secrets: SecretMetadata[]
  projectId: string
}

export default function SecretsTable({ secrets, projectId }: SecretsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({})
  const [fetchingId, setFetchingId] = useState<string | null>(null)

  async function handleReveal(secret: SecretMetadata) {
    setFetchingId(secret.id)
    const res = await fetch('/api/secrets/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, key_name: secret.key_name }),
    })
    const data = await res.json()
    if (res.ok) {
      setRevealedValues((prev) => ({ ...prev, [secret.id]: data.value }))
    }
    setFetchingId(null)
  }

  function handleHide(secretId: string) {
    setRevealedValues((prev) => {
      const next = { ...prev }
      delete next[secretId]
      return next
    })
  }

  async function handleDelete(secretId: string) {
    if (!confirm('Delete this secret? This cannot be undone.')) return
    setDeletingId(secretId)

    await fetch(`/api/secrets/${secretId}`, { method: 'DELETE' })

    setDeletingId(null)
    router.refresh()
  }

  if (!secrets.length) {
    return (
      <div className="text-center py-16 border border-dashed border-gray-700 rounded-lg">
        <p className="text-gray-400">No secrets yet.</p>
        <Link
          href={`/dashboard/projects/${projectId}/secrets/new`}
          className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
        >
          Add your first secret
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/50">
            <th className="text-left text-gray-400 font-medium px-4 py-3">Key</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Value</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Description</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Updated</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {secrets.map((secret) => (
            <tr key={secret.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-900/30">
              <td className="px-4 py-3 font-mono text-green-400">{secret.key_name}</td>
              <td className="px-4 py-3">
                {revealedValues[secret.id] ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-yellow-300 text-xs bg-gray-800 px-2 py-1 rounded max-w-48 truncate">
                      {revealedValues[secret.id]}
                    </span>
                    <button
                      onClick={() => handleHide(secret.id)}
                      className="text-gray-500 hover:text-gray-300 text-xs"
                    >
                      hide
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleReveal(secret)}
                    disabled={fetchingId === secret.id}
                    className="text-gray-500 hover:text-blue-400 text-xs font-mono disabled:opacity-50"
                  >
                    {fetchingId === secret.id ? 'fetching...' : '••••••••'}
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{secret.description ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(secret.updated_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(secret.id)}
                  disabled={deletingId === secret.id}
                  className="text-red-500 hover:text-red-400 text-xs disabled:opacity-50"
                >
                  {deletingId === secret.id ? 'deleting...' : 'delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
