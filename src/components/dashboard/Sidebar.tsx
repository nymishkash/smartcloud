'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-sm font-bold text-white">SmartCloud</h1>
        <p className="text-xs text-gray-500">Secrets Manager</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
        >
          Projects
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 truncate mb-3">{userEmail}</p>
        <Link
          href="/change-password"
          className="block text-xs text-gray-400 hover:text-white mb-2 transition-colors"
        >
          Change password
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
