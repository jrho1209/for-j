import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { readClient } from '@/sanity/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import AddFeedbackForm from './AddFeedbackForm'
import Image from 'next/image'

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const role = (session.user as any)?.role

  const memory = await readClient.fetch(
    `*[_type == "dateMemory" && _id == $id][0]{
      _id,
      proposal->{ _id, title, proposedDate },
      photos[]{ _key, asset->{ _id, url }, caption },
      boyfriendFeedback,
      girlfriendFeedback,
      rating,
      createdAt
    }`,
    { id }
  )

  if (!memory) notFound()

  const canAddFeedback =
    (role === 'boyfriend' && !memory.boyfriendFeedback) ||
    (role === 'girlfriend' && !memory.girlfriendFeedback)

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center animate-fade-in-up">
          <h1 className="text-2xl font-bold text-rose-700">
            {memory.proposal?.title || '데이트 기억'}
          </h1>
          {memory.proposal?.proposedDate && (
            <p className="text-rose-400 mt-1">
              {format(new Date(memory.proposal.proposedDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
            </p>
          )}
          {memory.rating && (
            <div className="flex gap-1 justify-center mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xl" style={{ color: i < memory.rating ? '#f43f5e' : '#fecdd3' }}>
                  ♥
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 사진 갤러리 */}
        {memory.photos && memory.photos.length > 0 && (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 gap-0.5">
              {memory.photos.map((photo: any, idx: number) => (
                <div
                  key={photo._key || idx}
                  className={`relative overflow-hidden ${
                    memory.photos.length === 1 ? 'col-span-2' : ''
                  } ${idx === 0 && memory.photos.length % 2 !== 0 ? 'col-span-2' : ''}`}
                  style={{ aspectRatio: '1' }}
                >
                  {photo.asset?.url && (
                    <Image
                      src={photo.asset.url}
                      alt={photo.caption || '데이트 사진'}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 후기 섹션 */}
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-rose-600 text-lg">💬 우리의 후기</h2>

          {memory.boyfriendFeedback && (
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#fff1f2,#fdf2f8)' }}>
              <div className="text-sm font-medium text-rose-400 mb-2">👦 남자친구</div>
              <p className="text-rose-700 leading-relaxed italic">"{memory.boyfriendFeedback}"</p>
            </div>
          )}

          {memory.girlfriendFeedback && (
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#fdf2f8,#fff1f2)' }}>
              <div className="text-sm font-medium text-rose-400 mb-2">👧 여자친구</div>
              <p className="text-rose-700 leading-relaxed italic">"{memory.girlfriendFeedback}"</p>
            </div>
          )}

          {!memory.boyfriendFeedback && !memory.girlfriendFeedback && (
            <p className="text-rose-300 text-center text-sm">아직 후기가 없어요</p>
          )}
        </div>

        {/* 후기 추가 폼 */}
        {canAddFeedback && (
          <AddFeedbackForm memoryId={id} role={role} />
        )}

        <Link href="/memories" className="btn-secondary block text-center">
          ← 앨범으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
