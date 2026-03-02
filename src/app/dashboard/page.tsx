import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your secret projects</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          New project
        </Link>
      </div>

      {!projects?.length ? (
        <div className="text-center py-16 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">No projects yet.</p>
          <Link
            href="/dashboard/projects/new"
            className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-600 transition-colors"
            >
              <h3 className="font-semibold text-white">{project.name}</h3>
              {project.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
              )}
              <p className="text-gray-600 text-xs mt-3">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
