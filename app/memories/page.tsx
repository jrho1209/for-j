import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { readClient } from '@/sanity/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function MemoriesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const memories = await readClient.fetch(
    `*[_type == "dateMemory"] | order(createdAt desc) {
      _id,
      proposal->{ _id, title, proposedDate },
      photos[0]{ asset->{ url } },
      boyfriendFeedback,
      girlfriendFeedback,
      rating,
      createdAt
    }`
  )

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>우리의 기억</h1>
          <p className="text-sm mt-1" style={{ color: '#9b7b72' }}>함께한 소중한 순간들 ♡</p>
        </div>

        {memories.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-xl mb-3" style={{ color: '#e8d8d0' }}>♡</div>
            <p className="text-sm font-medium" style={{ color: '#9b7b72' }}>아직 기억이 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#c4a89f' }}>데이트를 마친 후 기억을 남겨보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memories.map((memory: any) => (
              <Link
                key={memory._id}
                href={`/memories/${memory._id}`}
                className="card overflow-hidden block hover:-translate-y-0.5 transition-transform"
              >
                <div
                  className="h-44 flex items-center justify-center"
                  style={{
                    background: memory.photos?.[0]?.asset?.url
                      ? undefined
                      : 'linear-gradient(135deg, #f9f4f0, #f5ede6)',
                    backgroundImage: memory.photos?.[0]?.asset?.url
                      ? `url(${memory.photos[0].asset.url})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!memory.photos?.[0]?.asset?.url && (
                    <span style={{ color: '#e8d8d0', fontSize: '1.5rem' }}>♡</span>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="font-medium text-sm truncate" style={{ color: '#3d2c28' }}>
                    {memory.proposal?.title || '데이트 기억'}
                  </h2>
                  {memory.proposal?.proposedDate && (
                    <p className="text-xs mt-0.5" style={{ color: '#c4a89f' }}>
                      {format(new Date(memory.proposal.proposedDate), 'yyyy년 MM월 dd일', { locale: ko })}
                    </p>
                  )}
                  {memory.rating && (
                    <div className="flex gap-0.5 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < memory.rating ? '#c98d82' : '#e8d8d0', fontSize: '0.7rem' }}>
                          ♥
                        </span>
                      ))}
                    </div>
                  )}
                  {(memory.boyfriendFeedback || memory.girlfriendFeedback) && (
                    <p className="text-xs mt-2 line-clamp-1 italic" style={{ color: '#9b7b72' }}>
                      "{memory.boyfriendFeedback || memory.girlfriendFeedback}"
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
