'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ImageCarousel from '@/app/components/ImageCarousel'
import CourseMap from '@/app/components/CourseMap'
import { ko } from 'date-fns/locale'

interface Place {
  name: string
  description: string
  address: string
  url?: string
  lat?: number
  lng?: number
  imageAssetId?: string    // 하위 호환 유지
  imageAssetIds?: string[] // 여러 이미지
  imagePreview?: string
  imagePreviews?: string[] // 여러 미리보기
}

interface Course {
  title: string
  description: string
  places: Place[]
}

// 30분 단위 시간 옵션 생성
const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = [{ value: '', label: '시간 선택' }]
  for (let h = 8; h <= 23; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const period = h < 12 ? '오전' : h === 12 ? '낮' : '오후'
      const displayH = h <= 12 ? h : h - 12
      options.push({
        value: `${hh}:${mm}`,
        label: `${period} ${displayH}:${mm}`,
      })
    }
  }
  return options
})()

const emptyPlace = (): Place => ({ name: '', description: '', address: '', imageAssetId: undefined, imageAssetIds: undefined, imagePreview: undefined, imagePreviews: undefined })
const emptyCourse = (): Course => ({ title: '', description: '', places: [emptyPlace()] })

export default function NewProposalForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState({ title: '', proposedDate: '', proposedTime: '', message: '' })
  const [courses, setCourses] = useState<Course[]>([emptyCourse()])
  const coursesRef = useRef(courses)
  coursesRef.current = courses

  const addCourse = () => setCourses([...courses, emptyCourse()])

  const removeCourse = (ci: number) => setCourses(courses.filter((_, i) => i !== ci))

  const updateCourse = (ci: number, field: keyof Omit<Course, 'places'>, value: string) => {
    const updated = [...courses]
    updated[ci] = { ...updated[ci], [field]: value }
    setCourses(updated)
  }

  const addPlace = (ci: number) => {
    const updated = [...courses]
    updated[ci].places = [...updated[ci].places, emptyPlace()]
    setCourses(updated)
  }

  const removePlace = (ci: number, pi: number) => {
    const updated = [...courses]
    updated[ci].places = updated[ci].places.filter((_, i) => i !== pi)
    setCourses(updated)
  }

  const movePlace = (ci: number, from: number, to: number) => {
    if (from === to) return
    const updated = [...courses]
    const items = [...updated[ci].places]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    updated[ci].places = items
    setCourses(updated)
  }

  const updatePlace = (ci: number, pi: number, field: keyof Place, value: string) => {
    const updated = [...courses]
    updated[ci].places[pi] = { ...updated[ci].places[pi], [field]: value }
    setCourses(updated)
  }

  const fetchPlaceFromUrl = async (ci: number, pi: number, url: string) => {
    if (!url.includes('naver') && !url.includes('kakao') && !url.startsWith('http')) return
    const updated = coursesRef.current.map(c => ({ ...c, places: [...c.places] }))
    updated[ci].places[pi] = { ...updated[ci].places[pi], url, imagePreview: 'loading' }
    setCourses(updated)

    const res = await fetch('/api/place-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (res.ok) {
      const data = await res.json()
      const updated2 = coursesRef.current.map(c => ({ ...c, places: [...c.places] }))
      updated2[ci].places[pi] = {
        ...updated2[ci].places[pi],
        url,
        name: data.name || updated2[ci].places[pi].name,
        description: data.description || updated2[ci].places[pi].description,
        address: data.address || updated2[ci].places[pi].address,
        imageAssetId: data.assetId || updated2[ci].places[pi].imageAssetId,
        imagePreview: data.imageUrl || updated2[ci].places[pi].imagePreview,
        imageAssetIds: (data.assetIds && data.assetIds.length > 0) ? data.assetIds : updated2[ci].places[pi].imageAssetIds,
        imagePreviews: (data.imageUrls && data.imageUrls.length > 0) ? data.imageUrls : updated2[ci].places[pi].imagePreviews,
        lat: data.lat ?? updated2[ci].places[pi].lat,
        lng: data.lng ?? updated2[ci].places[pi].lng,
      }
      setCourses(updated2)
    } else {
      const updated2 = coursesRef.current.map(c => ({ ...c, places: [...c.places] }))
      updated2[ci].places[pi] = { ...updated2[ci].places[pi], url, imagePreview: undefined }
      setCourses(updated2)
    }
  }

  const uploadPlaceImage = async (ci: number, pi: number, file: File) => {
    const preview = URL.createObjectURL(file)
    const updated = coursesRef.current.map(c => ({ ...c, places: [...c.places] }))
    updated[ci].places[pi] = { ...updated[ci].places[pi], imagePreview: preview }
    setCourses(updated)

    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      const updated2 = coursesRef.current.map(c => ({ ...c, places: [...c.places] }))
      updated2[ci].places[pi] = { ...updated2[ci].places[pi], imageAssetId: data.assetId, imagePreview: preview }
      setCourses(updated2)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      // 1. 신청서 생성
      const proposalRes = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!proposalRes.ok) return
      const proposal = await proposalRes.json()

      // 2. 코스들 생성 (병렬)
      const validCourses = coursesRef.current.filter((c) => c.title.trim())
      await Promise.all(
        validCourses.map((course, i) =>
          fetch(`/api/proposals/${proposal._id}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...course,
              places: course.places
                .filter((p) => p.name.trim())
                .map(({ imagePreview, imagePreviews, imageAssetId, imageAssetIds, ...p }) => ({
                  ...p,
                  ...(imageAssetId ? { image: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } } : {}),
                  ...(imageAssetIds && imageAssetIds.length > 0
                    ? { images: imageAssetIds.map(id => ({ _type: 'image', asset: { _type: 'reference', _ref: id } })) }
                    : {}),
                  lat: p.lat ?? undefined,
                  lng: p.lng ?? undefined,
                })),
              order: i,
            }),
          })
        )
      )

      router.push(`/proposals/${proposal._id}`)
    } finally {
      setLoading(false)
    }
  }

  if (showPreview) {
    const validCourses = courses.filter((c) => c.title.trim())
    return (
      <div className="space-y-4">
        {/* 미리보기 헤더 */}
        <div className="rounded-xl px-4 py-2.5 text-xs font-medium text-center" style={{ background: '#f5ede6', color: '#b5614e' }}>
          미리보기 — 실제 신청 전 확인해보세요
        </div>

        {/* 신청 내용 */}
        <div className="card p-7">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>{form.title || '(제목 없음)'}</h1>
              {form.proposedDate && (
                <p className="text-sm mt-1" style={{ color: '#9b7b72' }}>
                  {format(new Date(form.proposedDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                  {form.proposedTime && ` · ${form.proposedTime}`}
                </p>
              )}
            </div>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full shrink-0" style={{ color: '#b5614e', background: '#b5614e18' }}>
              답장 대기 중
            </span>
          </div>
          {form.message && (
            <div className="rounded-xl p-4" style={{ background: '#f9f4f0' }}>
              <p className="text-sm italic leading-relaxed" style={{ color: '#7a5548' }}>"{form.message}"</p>
            </div>
          )}
        </div>

        {/* 코스 지도 */}
        {validCourses.length > 0 && (
          <CourseMap
            courses={validCourses.map((c, i) => ({
              _id: `preview-${i}`,
              title: c.title,
              places: c.places.filter(p => p.name.trim()).map(p => ({
                name: p.name,
                lat: p.lat,
                lng: p.lng,
              })),
            }))}
          />
        )}

        {/* 코스 목록 */}
        {validCourses.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold px-1" style={{ color: '#9b7b72' }}>코스 옵션 {validCourses.length}개</h2>
            {validCourses.map((course, idx) => (
              <div key={idx} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#f5ede6', color: '#b5614e' }}>
                    {idx + 1}
                  </div>
                  <h3 className="font-medium text-sm" style={{ color: '#3d2c28' }}>{course.title}</h3>
                </div>
                {course.description && (
                  <p className="text-sm mb-3 ml-10 leading-relaxed" style={{ color: '#7a5548' }}>{course.description}</p>
                )}
                {course.places.filter((p) => p.name.trim()).length > 0 && (
                  <div className="ml-10 space-y-3">
                    {course.places.filter((p) => p.name.trim()).map((place, i) => (
                      <div key={i}>
                        {(() => {
                          const previews = place.imagePreviews && place.imagePreviews.length > 0
                            ? place.imagePreviews.slice(0, 3)
                            : place.imagePreview && place.imagePreview !== 'loading'
                              ? [place.imagePreview]
                              : []
                          return <ImageCarousel images={previews} href={place.url} />
                        })()}
                        <div className="flex items-start gap-2">
                          <span className="text-sm shrink-0" style={{ color: '#c98d82' }}>·</span>
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#3d2c28' }}>{place.name}</div>
                            {place.description && <div className="text-xs mt-0.5" style={{ color: '#9b7b72' }}>{place.description}</div>}
                            {place.address && <div className="text-xs mt-0.5" style={{ color: '#c4a89f' }}>{place.address}</div>}
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

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => setShowPreview(false)} className="btn-secondary flex-1">수정하기</button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as any)}
            className="btn-primary flex-1"
          >
            {loading ? '전송 중...' : '신청하기'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true) }} className="space-y-4">
      {/* 기본 정보 */}
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>제목</label>
          <input
            className="input-romantic"
            type="text"
            placeholder="예: 벚꽃 보러 가요"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>날짜</label>
            <input
              className="input-romantic"
              type="date"
              value={form.proposedDate}
              onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>시간</label>
            <select
              className="input-romantic"
              value={form.proposedTime}
              onChange={(e) => setForm({ ...form, proposedTime: e.target.value })}
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>메시지</label>
          <textarea
            className="input-romantic"
            rows={3}
            placeholder="상대방에게 전하고 싶은 말을 적어보세요"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={{ resize: 'none' }}
          />
        </div>
      </div>

      {/* 코스 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#3d2c28' }}>데이트 코스</p>
            <p className="text-xs mt-0.5" style={{ color: '#9b7b72' }}>여자친구가 하나를 골라요</p>
          </div>
          <button type="button" onClick={addCourse} className="btn-secondary text-xs py-1.5 px-3">
            + 코스 추가
          </button>
        </div>

        {courses.map((course, ci) => (
          <div key={ci} className="card p-5 space-y-3">
            {/* 코스 헤더 */}
            <div className="flex items-center justify-between">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#f5ede6', color: '#b5614e' }}
              >
                {ci + 1}
              </div>
              {courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCourse(ci)}
                  className="text-xs transition-colors"
                  style={{ color: '#c4a89f' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}
                >
                  삭제
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b7b72' }}>코스 이름</label>
              <input
                className="input-romantic text-sm"
                placeholder="예: 성수동 카페 투어"
                value={course.title}
                onChange={(e) => updateCourse(ci, 'title', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b7b72' }}>간단 설명</label>
              <input
                className="input-romantic text-sm"
                placeholder="이 코스에 대한 한 줄 설명"
                value={course.description}
                onChange={(e) => updateCourse(ci, 'description', e.target.value)}
              />
            </div>

            {/* 장소 목록 */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium" style={{ color: '#9b7b72' }}>장소</p>
              {course.places.map((place, pi) => (
                <div
                  key={pi}
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: '#faf7f4', border: '1px solid #f0e8e0' }}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(pi)) }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={(e) => { e.preventDefault(); movePlace(ci, parseInt(e.dataTransfer.getData('text/plain')), pi) }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="cursor-grab active:cursor-grabbing select-none text-sm"
                        style={{ color: '#c4a89f' }}
                        title="드래그하여 순서 변경"
                      >⠿</span>
                      <span className="text-xs" style={{ color: '#c4a89f' }}>장소 {pi + 1}</span>
                    </div>
                    {course.places.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlace(ci, pi)}
                        className="text-xs"
                        style={{ color: '#c4a89f' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <input
                    className="input-romantic text-xs"
                    placeholder="네이버 플레이스 URL 붙여넣기 (자동완성)"
                    value={place.url || ''}
                    onChange={(e) => updatePlace(ci, pi, 'url', e.target.value)}
                    onBlur={(e) => e.target.value && fetchPlaceFromUrl(ci, pi, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchPlaceFromUrl(ci, pi, (e.target as HTMLInputElement).value))}
                    style={{ borderColor: '#d4b8b0' }}
                  />
                  <input
                    className="input-romantic text-xs"
                    placeholder="장소명 (예: 블루보틀 성수)"
                    value={place.name}
                    onChange={(e) => updatePlace(ci, pi, 'name', e.target.value)}
                  />
                  <input
                    className="input-romantic text-xs"
                    placeholder="주소 (선택)"
                    value={place.address}
                    onChange={(e) => updatePlace(ci, pi, 'address', e.target.value)}
                  />
                  <input
                    className="input-romantic text-xs"
                    placeholder="간단 설명 (선택)"
                    value={place.description}
                    onChange={(e) => updatePlace(ci, pi, 'description', e.target.value)}
                  />
                  {place.imagePreview === 'loading' ? (
                    <div className="rounded-xl h-28 flex items-center justify-center" style={{ background: '#f9f4f0', border: '1px dashed #e8d8d0' }}>
                      <span className="text-xs" style={{ color: '#c4a89f' }}>이미지 불러오는 중...</span>
                    </div>
                  ) : (place.imagePreviews && place.imagePreviews.length > 0) || place.imagePreview ? (
                    <ImageCarousel
                      images={
                        place.imagePreviews && place.imagePreviews.length > 0
                          ? place.imagePreviews.slice(0, 3)
                          : [place.imagePreview!]
                      }
                    />
                  ) : (
                    <label
                      className="block rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: '1px dashed #e8d8d0' }}
                    >
                      <div className="py-3 text-center">
                        <span className="text-xs" style={{ color: '#c4a89f' }}>사진 추가 (선택)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadPlaceImage(ci, pi, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPlace(ci)}
                className="text-xs w-full py-2 rounded-xl transition-colors"
                style={{ color: '#9b7b72', border: '1px dashed #e8d8d0' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c98d82')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8d8d0')}
              >
                + 장소 추가
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">취소</button>
        <button type="submit" className="btn-primary flex-1">미리보기</button>
      </div>
    </form>
  )
}
