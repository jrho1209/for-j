import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { readClient } from '@/sanity/client'
import NewMemoryForm from './NewMemoryForm'

export default async function NewMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ proposalId?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { proposalId } = await searchParams
  if (!proposalId) redirect('/proposals')

  const proposal = await readClient.fetch(
    `*[_type == "dateProposal" && _id == $id][0]{ _id, title, proposedDate }`,
    { id: proposalId }
  )

  if (!proposal) redirect('/proposals')

  const role = (session.user as any)?.role

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>📷</div>
          <h1 className="text-2xl font-bold text-rose-600">데이트 기억 남기기</h1>
          <p className="text-rose-400 text-sm mt-1">{proposal.title}</p>
        </div>
        <NewMemoryForm proposalId={proposalId} role={role} />
      </div>
    </div>
  )
}
