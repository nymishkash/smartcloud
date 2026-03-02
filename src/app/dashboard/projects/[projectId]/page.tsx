import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SecretsTable from '@/components/secrets/SecretsTable'

type Props = { params: Promise<{ projectId: string }> }

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: project }, { data: secrets }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description')
      .eq('id', projectId)
      .single(),
    supabase
      .from('secrets')
      .select('id, key_name, description, created_at, updated_at')
      .eq('project_id', projectId)
      .order('key_name', { ascending: true }),
  ])

  if (!project) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Projects
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
          )}
        </div>
        <Link
          href={`/dashboard/projects/${projectId}/secrets/new`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          Add secret
        </Link>
      </div>

      <SecretsTable secrets={secrets ?? []} projectId={projectId} />
    </div>
  )
}
