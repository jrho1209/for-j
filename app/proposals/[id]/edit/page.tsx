import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { readClient } from '@/sanity/client'
import EditProposalForm from './EditProposalForm'

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as any)?.role
  if (role !== 'boyfriend') notFound()

  const { id } = await params

  const [proposal, courses] = await Promise.all([
    readClient.fetch(
      `*[_type == "dateProposal" && _id == $id][0]{
        _id, title, proposedDate, proposedTime, message, status
      }`,
      { id }
    ),
    readClient.fetch(
      `*[_type == "dateCourse" && proposal._ref == $id] | order(order asc) {
        _id, title, description, order,
        places[]{ name, description, address, url, emoji, lat, lng,
          image{ asset->{ _id, url } },
          images[]{ asset->{ _id, url } }
        }
      }`,
      { id }
    ),
  ])

  if (!proposal) notFound()
  if (proposal.status !== 'pending') redirect(`/proposals/${id}`)

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#3d2c28' }}>신청 수정하기</h1>
          <p className="text-xs mt-1" style={{ color: '#c4a89f' }}>수락 전에만 수정할 수 있어요</p>
        </div>
        <EditProposalForm proposal={proposal} initialCourses={courses} />
      </div>
    </div>
  )
}
