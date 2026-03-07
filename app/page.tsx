import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { readClient } from '@/sanity/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: '답장 대기 중', color: '#b5614e' },
  accepted: { label: '수락됨', color: '#8b6fbf' },
  declined: { label: '거절됨', color: '#9b7b72' },
  selecting: { label: '코스 선택 중', color: '#a07840' },
  confirmed: { label: '확정', color: '#4a8f6a' },
  completed: { label: '완료', color: '#5c6fbf' },
  cancelled: { label: '취소됨', color: '#a09090' },
}

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as any)?.role
  const name = session.user?.name

  const [proposals, memories] = await Promise.all([
    readClient.fetch(
      role === 'girlfriend'
        ? `*[_type == "dateProposal" && status != "cancelled"] | order(createdAt desc)[0...3]{ _id, title, proposedDate, status }`
        : `*[_type == "dateProposal"] | order(createdAt desc)[0...3]{ _id, title, proposedDate, status }`
    ),
    readClient.fetch(
      `count(*[_type == "dateMemory"])`
    ),
  ])

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* 인사 */}
        <div className="mb-10 animate-fade-in-up">
          <p className="text-sm mb-1" style={{ color: '#9b7b72' }}>안녕하세요,</p>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>
            {name} ♡
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#9b7b72' }}>
            서로에게 특별한 데이트를 제안해보세요
          </p>
        </div>

        {/* 퀵 액션 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link href="/proposals/new" className="card p-5 hover:-translate-y-0.5 transition-transform block">
            <div className="text-sm font-semibold mb-0.5" style={{ color: '#3d2c28' }}>데이트 신청</div>
            <div className="text-xs" style={{ color: '#9b7b72' }}>새로운 데이트를 제안해요</div>
          </Link>
          <Link href="/proposals" className="card p-5 hover:-translate-y-0.5 transition-transform block">
            <div className="text-sm font-semibold mb-0.5" style={{ color: '#3d2c28' }}>신청 목록</div>
            <div className="text-xs" style={{ color: '#9b7b72' }}>모든 데이트 신청 보기</div>
          </Link>
          <Link href="/memories" className="card p-5 hover:-translate-y-0.5 transition-transform block">
            <div className="text-sm font-semibold mb-0.5" style={{ color: '#3d2c28' }}>우리의 기억</div>
            <div className="text-xs" style={{ color: '#9b7b72' }}>{memories}개의 추억이 담겨있어요</div>
          </Link>
        </div>

        {/* 최근 데이트 신청 */}
        {proposals.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#9b7b72' }}>최근 신청</h2>
            <div className="space-y-1">
              {proposals.map((p: any) => (
                <Link
                  key={p._id}
                  href={`/proposals/${p._id}`}
                  className="proposal-row flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#3d2c28' }}>{p.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#c4a89f' }}>
                      {p.proposedDate && format(new Date(p.proposedDate), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: statusLabel[p.status]?.color || '#9b7b72',
                      background: (statusLabel[p.status]?.color || '#9b7b72') + '18',
                    }}
                  >
                    {statusLabel[p.status]?.label || p.status}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e8d8d0' }}>
              <Link href="/proposals" className="text-xs" style={{ color: '#9b7b72' }}>
                전체 보기 →
              </Link>
            </div>
          </div>
        )}

        {proposals.length === 0 && (
          <div className="card p-14 text-center">
            <div className="text-xl mb-3" style={{ color: '#e8d8d0', animation: 'float 4s ease-in-out infinite' }}>♡</div>
            <p className="text-sm font-medium" style={{ color: '#9b7b72' }}>아직 데이트 신청이 없어요</p>
            {role === 'boyfriend' && (
              <Link href="/proposals/new" className="btn-primary mt-5 inline-block">
                첫 데이트 신청하기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
