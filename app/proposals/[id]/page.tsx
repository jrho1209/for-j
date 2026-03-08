import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { readClient } from '@/sanity/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ProposalActions from './ProposalActions'
import Link from 'next/link'
import ImageCarousel from '@/app/components/ImageCarousel'
import CourseMap from '@/app/components/CourseMap'

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const role = (session.user as any)?.role

  const [proposal, courses] = await Promise.all([
    readClient.fetch(
      `*[_type == "dateProposal" && _id == $id][0]{
        _id, title, proposedDate, proposedTime, message, status, selectedCourseId, createdAt
      }`,
      { id }
    ),
    readClient.fetch(
      `*[_type == "dateCourse" && proposal._ref == $id] | order(order asc) {
        _id, title, description, order,
        places[]{ name, description, address, url, emoji, lat, lng, image{ asset->{ url } }, images[]{ asset->{ url } } }
      }`,
      { id }
    ),
  ])

  if (!proposal) notFound()
  if (proposal.status === 'cancelled' && role === 'girlfriend') notFound()

  const memory = await readClient.fetch(
    `*[_type == "dateMemory" && proposal._ref == $id][0]{ _id }`,
    { id }
  )

  const statusBadge: Record<string, { label: string; color: string }> = {
    pending: { label: '답장 대기 중', color: '#b5614e' },
    accepted: { label: '수락됨', color: '#8b6fbf' },
    declined: { label: '거절됨', color: '#9b7b72' },
    selecting: { label: '코스 선택 중', color: '#a07840' },
    confirmed: { label: '확정', color: '#4a8f6a' },
    completed: { label: '완료', color: '#5c6fbf' },
    cancelled: { label: '취소됨', color: '#a09090' },
  }

  const badge = statusBadge[proposal.status] || statusBadge.pending

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* 메인 카드 */}
        <div className="card p-7 animate-fade-in-up">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>{proposal.title}</h1>
              {proposal.proposedDate && (
                <p className="text-sm mt-1" style={{ color: '#9b7b72' }}>
                  {format(new Date(proposal.proposedDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                  {proposal.proposedTime && ` · ${proposal.proposedTime}`}
                </p>
              )}
            </div>
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full shrink-0"
              style={{ color: badge.color, background: badge.color + '18' }}
            >
              {badge.label}
            </span>
          </div>

          {proposal.message && (
            <div className="rounded-xl p-4 mb-5" style={{ background: '#f9f4f0' }}>
              <p className="text-sm italic leading-relaxed" style={{ color: '#7a5548' }}>"{proposal.message}"</p>
            </div>
          )}

          <ProposalActions
            proposal={proposal}
            role={role}
            courses={courses}
            memoryId={memory?._id}
          />
        </div>

        {/* 코스 지도 */}
        {courses.length > 0 && (
          <CourseMap courses={courses} selectedCourseId={proposal.selectedCourseId} />
        )}

        {/* 코스 목록 */}
        {courses.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold px-1" style={{ color: '#9b7b72' }}>
              코스 옵션 {courses.length}개
            </h2>
            {courses.map((course: any, idx: number) => (
              <div
                key={course._id}
                className="card p-5"
                style={{
                  border: course._id === proposal.selectedCourseId ? '1.5px solid #b5614e' : undefined,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: '#f5ede6', color: '#b5614e' }}
                  >
                    {idx + 1}
                  </div>
                  <h3 className="font-medium text-sm" style={{ color: '#3d2c28' }}>{course.title}</h3>
                  {course._id === proposal.selectedCourseId && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#b5614e', color: '#fffdf9' }}>선택됨</span>
                  )}
                </div>

                {course.description && (
                  <p className="text-sm mb-3 ml-10 leading-relaxed" style={{ color: '#7a5548' }}>{course.description}</p>
                )}

                {course.places && course.places.length > 0 && (
                  <div className="ml-10 space-y-3">
                    {course.places.map((place: any, i: number) => (
                      <div key={place._key || i}>
                        {(() => {
                          const imageSrcs: string[] =
                            place.images && place.images.length > 0
                              ? place.images.slice(0, 3).map((img: any) => img?.asset?.url).filter(Boolean)
                              : place.image?.asset?.url
                                ? [place.image.asset.url]
                                : []
                          return <ImageCarousel images={imageSrcs} href={place.url} title={place.name} />
                        })()}
                        <div className="flex items-start gap-2">
                          <span className="text-sm shrink-0" style={{ color: '#c98d82' }}>·</span>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#3d2c28' }}>{place.name}</div>
                            {place.description && (
                              <div className="text-xs mt-0.5" style={{ color: '#9b7b72' }}>{place.description}</div>
                            )}
                            {place.address && (
                              <div className="text-xs mt-0.5" style={{ color: '#c4a89f' }}>{place.address}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {role === 'boyfriend' && ['accepted', 'selecting'].includes(proposal.status) && (
          <Link href={`/proposals/${id}/courses/new`} className="btn-secondary block text-center">
            + 코스 추가하기
          </Link>
        )}

        {memory && (
          <Link href={`/memories/${memory._id}`} className="btn-primary block text-center">
            데이트 기억 보기
          </Link>
        )}

        {proposal.status === 'confirmed' && !memory && (
          <Link href={`/memories/new?proposalId=${id}`} className="btn-primary block text-center">
            데이트 기억 남기기
          </Link>
        )}
      </div>
    </div>
  )
}
