'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ImageCarousel from '@/app/components/ImageCarousel'

interface Place {
  name: string
  description: string
  address: string
  url?: string
  lat?: number
  lng?: number
  imageAssetId?: string
  imageAssetIds?: string[]
  imagePreview?: string
  imagePreviews?: string[]
}

interface Course {
  title: string
  description: string
  places: Place[]
}

const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = [{ value: '', label: '시간 선택' }]
  for (let h = 8; h <= 23; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const period = h < 12 ? '오전' : h === 12 ? '낮' : '오후'
      const displayH = h <= 12 ? h : h - 12
      options.push({ value: `${hh}:${mm}`, label: `${period} ${displayH}:${mm}` })
    }
  }
  return options
})()

const emptyPlace = (): Place => ({ name: '', description: '', address: '' })
const emptyCourse = (): Course => ({ title: '', description: '', places: [emptyPlace()] })

function sanityPlaceToFormPlace(p: any): Place {
  const assetIds = p.images?.map((img: any) => img?.asset?._id).filter(Boolean) ?? []
  const previews = p.images?.map((img: any) => img?.asset?.url).filter(Boolean) ?? []
  return {
    name: p.name ?? '',
    description: p.description ?? '',
    address: p.address ?? '',
    url: p.url ?? '',
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    imageAssetId: p.image?.asset?._id,
    imageAssetIds: assetIds.length > 0 ? assetIds : undefined,
    imagePreview: p.image?.asset?.url,
    imagePreviews: previews.length > 0 ? previews : undefined,
  }
}

interface Props {
  proposal: {
    _id: string
    title: string
    proposedDate?: string
    proposedTime?: string
    message?: string
  }
  initialCourses: any[]
}

export default function EditProposalForm({ proposal, initialCourses }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: proposal.title ?? '',
    proposedDate: proposal.proposedDate ?? '',
    proposedTime: proposal.proposedTime ?? '',
    message: proposal.message ?? '',
  })
  const [courses, setCourses] = useState<Course[]>(
    initialCourses.length > 0
      ? initialCourses.map(c => ({
          title: c.title ?? '',
          description: c.description ?? '',
          places: c.places?.length > 0 ? c.places.map(sanityPlaceToFormPlace) : [emptyPlace()],
        }))
      : [emptyCourse()]
  )
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
        imageAssetIds: data.assetIds?.length > 0 ? data.assetIds : updated2[ci].places[pi].imageAssetIds,
        imagePreviews: data.imageUrls?.length > 0 ? data.imageUrls : updated2[ci].places[pi].imagePreviews,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. 신청서 기본 정보 수정
      await fetch(`/api/proposals/${proposal._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      // 2. 기존 코스 전부 삭제
      await fetch(`/api/proposals/${proposal._id}/courses`, { method: 'DELETE' })

      // 3. 새 코스들 생성
      const validCourses = coursesRef.current.filter(c => c.title.trim())
      await Promise.all(
        validCourses.map((course, i) =>
          fetch(`/api/proposals/${proposal._id}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...course,
              places: course.places
                .filter(p => p.name.trim())
                .map(({ imagePreview, imagePreviews, imageAssetId, imageAssetIds, ...p }) => ({
                  ...p,
                  ...(imageAssetId ? { image: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } } : {}),
                  ...(imageAssetIds?.length
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
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 기본 정보 */}
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>제목</label>
          <input
            className="input-romantic"
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
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
              onChange={e => setForm({ ...form, proposedDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>시간</label>
            <select
              className="input-romantic"
              value={form.proposedTime}
              onChange={e => setForm({ ...form, proposedTime: e.target.value })}
            >
              {TIME_OPTIONS.map(opt => (
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
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
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
            <div className="flex items-center justify-between">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#f5ede6', color: '#b5614e' }}>
                {ci + 1}
              </div>
              {courses.length > 1 && (
                <button type="button" onClick={() => removeCourse(ci)} className="text-xs transition-colors" style={{ color: '#c4a89f' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}>
                  삭제
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b7b72' }}>코스 이름</label>
              <input className="input-romantic text-sm" placeholder="예: 성수동 카페 투어" value={course.title}
                onChange={e => updateCourse(ci, 'title', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b7b72' }}>간단 설명</label>
              <input className="input-romantic text-sm" placeholder="이 코스에 대한 한 줄 설명" value={course.description}
                onChange={e => updateCourse(ci, 'description', e.target.value)} />
            </div>

            {/* 장소 목록 */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium" style={{ color: '#9b7b72' }}>장소</p>
              {course.places.map((place, pi) => (
                <div key={pi} className="rounded-xl p-3 space-y-2" style={{ background: '#faf7f4', border: '1px solid #f0e8e0' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#c4a89f' }}>장소 {pi + 1}</span>
                    {course.places.length > 1 && (
                      <button type="button" onClick={() => removePlace(ci, pi)} className="text-xs" style={{ color: '#c4a89f' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}>
                        삭제
                      </button>
                    )}
                  </div>
                  <input className="input-romantic text-xs" placeholder="네이버 플레이스 URL 붙여넣기 (자동완성)"
                    value={place.url || ''} onChange={e => updatePlace(ci, pi, 'url', e.target.value)}
                    onBlur={e => e.target.value && fetchPlaceFromUrl(ci, pi, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchPlaceFromUrl(ci, pi, (e.target as HTMLInputElement).value))}
                    style={{ borderColor: '#d4b8b0' }} />
                  <input className="input-romantic text-xs" placeholder="장소명" value={place.name}
                    onChange={e => updatePlace(ci, pi, 'name', e.target.value)} />
                  <input className="input-romantic text-xs" placeholder="주소 (선택)" value={place.address}
                    onChange={e => updatePlace(ci, pi, 'address', e.target.value)} />
                  <input className="input-romantic text-xs" placeholder="간단 설명 (선택)" value={place.description}
                    onChange={e => updatePlace(ci, pi, 'description', e.target.value)} />
                  {place.imagePreview === 'loading' ? (
                    <div className="rounded-xl h-28 flex items-center justify-center" style={{ background: '#f9f4f0', border: '1px dashed #e8d8d0' }}>
                      <span className="text-xs" style={{ color: '#c4a89f' }}>이미지 불러오는 중...</span>
                    </div>
                  ) : (place.imagePreviews && place.imagePreviews.length > 0) || place.imagePreview ? (
                    <ImageCarousel
                      images={place.imagePreviews?.length ? place.imagePreviews.slice(0, 3) : [place.imagePreview!]}
                    />
                  ) : (
                    <label className="block rounded-xl overflow-hidden cursor-pointer" style={{ border: '1px dashed #e8d8d0' }}>
                      <div className="py-3 text-center">
                        <span className="text-xs" style={{ color: '#c4a89f' }}>사진 추가 (선택)</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && uploadPlaceImage(ci, pi, e.target.files[0])} />
                    </label>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addPlace(ci)}
                className="text-xs w-full py-2 rounded-xl transition-colors"
                style={{ color: '#9b7b72', border: '1px dashed #e8d8d0' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#c98d82')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8d8d0')}>
                + 장소 추가
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">취소</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </form>
  )
}
