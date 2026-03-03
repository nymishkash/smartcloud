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
      .select('id, project_id, key_name, description, created_at, updated_at')
      .eq('project_id', projectId)
      .order('key_name', { ascending: true }),
  ])

  if (!project) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Projects
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2 tracking-tight">{project.name}</h1>
          <span className="inline-block bg-white/5 border border-white/10 text-gray-400 text-xs font-mono px-2 py-0.5 rounded-lg mt-1.5">
            {project.id}
          </span>
          {project.description && (
            <p className="text-gray-400 text-sm mt-2">{project.description}</p>
          )}
        </div>
        <Link href={`/dashboard/projects/${projectId}/secrets/new`} className="btn-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add secret
        </Link>
      </div>

      <SecretsTable secrets={secrets ?? []} projectId={projectId} />
    </div>
  )
}
