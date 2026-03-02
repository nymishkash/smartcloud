import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar userEmail={user.email ?? ''} />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
