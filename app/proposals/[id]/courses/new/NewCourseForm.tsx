'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Place {
  name: string
  description: string
  address: string
  imageAssetId?: string
  imagePreview?: string
}

const emptyPlace = (): Place => ({ name: '', description: '', address: '' })

export default function NewCourseForm({ proposalId }: { proposalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [places, setPlaces] = useState<Place[]>([emptyPlace()])

  const addPlace = () => setPlaces([...places, emptyPlace()])

  const removePlace = (idx: number) => setPlaces(places.filter((_, i) => i !== idx))

  const updatePlace = (idx: number, field: keyof Omit<Place, 'imageAssetId' | 'imagePreview'>, value: string) => {
    const updated = [...places]
    updated[idx] = { ...updated[idx], [field]: value }
    setPlaces(updated)
  }

  const fetchPlaceFromUrl = async (idx: number, url: string) => {
    if (!url) return
    const updated = [...places]
    updated[idx] = { ...updated[idx], imagePreview: 'loading' }
    setPlaces(updated)

    const res = await fetch('/api/place-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (res.ok) {
      const data = await res.json()
      const updated2 = [...places]
      updated2[idx] = {
        ...updated2[idx],
        name: data.name || updated2[idx].name,
        description: data.description || updated2[idx].description,
        address: data.address || updated2[idx].address,
        imageAssetId: data.assetId || updated2[idx].imageAssetId,
        imagePreview: data.imageUrl || updated2[idx].imagePreview,
      }
      setPlaces(updated2)
    } else {
      const updated2 = [...places]
      updated2[idx] = { ...updated2[idx], imagePreview: undefined }
      setPlaces(updated2)
    }
  }

  const uploadPlaceImage = async (idx: number, file: File) => {
    const preview = URL.createObjectURL(file)
    const updated = [...places]
    updated[idx] = { ...updated[idx], imagePreview: preview }
    setPlaces(updated)

    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      const updated2 = [...places]
      updated2[idx] = { ...updated2[idx], imageAssetId: data.assetId, imagePreview: preview }
      setPlaces(updated2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          places: places
            .filter((p) => p.name.trim())
            .map(({ imagePreview, imageAssetId, ...p }) => ({
              ...p,
              ...(imageAssetId ? { image: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } } : {}),
            })),
        }),
      })
      if (res.ok) {
        router.push(`/proposals/${proposalId}`)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>코스 이름</label>
          <input
            className="input-romantic"
            type="text"
            placeholder="예: 홍대 → 이태원 데이트"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>코스 설명</label>
          <textarea
            className="input-romantic"
            rows={2}
            placeholder="이 코스에 대한 간단한 설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ resize: 'none' }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold" style={{ color: '#3d2c28' }}>장소</p>
          <button type="button" onClick={addPlace} className="btn-secondary text-xs py-1.5 px-3">
            + 장소 추가
          </button>
        </div>

        {places.map((place, idx) => (
          <div key={idx} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#9b7b72' }}>장소 {idx + 1}</span>
              {places.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlace(idx)}
                  className="text-xs transition-colors"
                  style={{ color: '#c4a89f' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}
                >
                  삭제
                </button>
              )}
            </div>
            <input
              className="input-romantic text-sm"
              placeholder="네이버 플레이스 URL 붙여넣기 (자동완성)"
              onBlur={(e) => e.target.value && fetchPlaceFromUrl(idx, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchPlaceFromUrl(idx, (e.target as HTMLInputElement).value))}
              style={{ borderColor: '#d4b8b0' }}
            />
            <input
              className="input-romantic text-sm"
              placeholder="장소명 (예: 블루보틀 성수)"
              value={place.name}
              onChange={(e) => updatePlace(idx, 'name', e.target.value)}
            />
            <input
              className="input-romantic text-sm"
              placeholder="주소 (선택)"
              value={place.address}
              onChange={(e) => updatePlace(idx, 'address', e.target.value)}
            />
            <input
              className="input-romantic text-sm"
              placeholder="간단 설명 (선택)"
              value={place.description}
              onChange={(e) => updatePlace(idx, 'description', e.target.value)}
            />
            <label
              className="block rounded-xl overflow-hidden cursor-pointer"
              style={{ border: '1px dashed #e8d8d0' }}
            >
              {place.imagePreview === 'loading' ? (
                <div className="h-28 flex items-center justify-center" style={{ background: '#f9f4f0' }}>
                  <span className="text-xs" style={{ color: '#c4a89f' }}>이미지 불러오는 중...</span>
                </div>
              ) : place.imagePreview ? (
                <div
                  className="h-28"
                  style={{
                    backgroundImage: `url(${place.imagePreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div className="py-3 text-center">
                  <span className="text-xs" style={{ color: '#c4a89f' }}>사진 추가 (선택)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadPlaceImage(idx, e.target.files[0])}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">취소</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? '저장 중...' : '코스 저장하기'}
        </button>
      </div>
    </form>
  )
}
