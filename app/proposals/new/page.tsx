import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import NewProposalForm from './NewProposalForm'

export default async function NewProposalPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-7">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>데이트 신청하기</h1>
          <p className="text-sm mt-1" style={{ color: '#9b7b72' }}>날짜와 코스를 함께 제안해보세요</p>
        </div>
        <NewProposalForm />
      </div>
    </div>
  )
}
