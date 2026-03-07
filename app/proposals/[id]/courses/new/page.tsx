import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { readClient } from '@/sanity/client'
import NewCourseForm from './NewCourseForm'

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as any)?.role
  const { id } = await params

  if (role !== 'boyfriend') redirect(`/proposals/${id}`)

  const proposal = await readClient.fetch(
    `*[_type == "dateProposal" && _id == $id][0]{ _id, title }`,
    { id }
  )

  if (!proposal) redirect('/proposals')

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗺️</div>
          <h1 className="text-2xl font-bold text-rose-600">데이트 코스 추가</h1>
          <p className="text-rose-300 text-sm mt-1">"{proposal.title}"을 위한 코스</p>
        </div>
        <NewCourseForm proposalId={id} />
      </div>
    </div>
  )
}
