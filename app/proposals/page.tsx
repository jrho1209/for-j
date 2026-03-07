import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { readClient } from '@/sanity/client'
import Link from 'next/link'
import ProposalTabs from './ProposalTabs'

export default async function ProposalsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as any)?.role

  const proposals = await readClient.fetch(
    role === 'girlfriend'
      ? `*[_type == "dateProposal" && status != "cancelled"] | order(createdAt desc) { _id, title, proposedDate, proposedTime, message, status, createdBy, createdAt }`
      : `*[_type == "dateProposal"] | order(createdAt desc) { _id, title, proposedDate, proposedTime, message, status, createdBy, createdAt }`
  )

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>데이트 신청</h1>
          <Link href="/proposals/new" className="btn-primary text-sm">+ 새 신청</Link>
        </div>
        <ProposalTabs proposals={proposals} role={role} />
      </div>
    </div>
  )
}
