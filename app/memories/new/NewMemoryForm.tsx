'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMemoryForm({
  proposalId,
  role,
}: {
  proposalId: string
  role: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [uploadedAssets, setUploadedAssets] = useState<{ assetId: string; url: string }[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const newPreviews: string[] = []
    const newAssets: { assetId: string; url: string }[] = []

    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file)
      newPreviews.push(preview)

      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        newAssets.push(data)
      }
    }

    setPreviews((prev) => [...prev, ...newPreviews])
    setUploadedAssets((prev) => [...prev, ...newAssets])
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const body: any = {
      proposalId,
      rating,
      photos: uploadedAssets.map((a) => ({
        _type: 'image',
        asset: { _type: 'reference', _ref: a.assetId },
      })),
    }

    if (role === 'boyfriend') body.boyfriendFeedback = feedback
    else body.girlfriendFeedback = feedback

    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/memories/${data._id}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 사진 업로드 */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold mb-3" style={{ color: '#9b7b72' }}>사진</h2>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {previews.map((src, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden"
                style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            ))}
          </div>
        )}

        <div
          className="rounded-xl p-7 text-center cursor-pointer transition-colors"
          style={{ border: '1.5px dashed #e8d8d0' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#c98d82')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8d8d0')}
        >
          <div className="text-xl mb-1.5" style={{ color: '#e8d8d0' }}>+</div>
          <p className="text-xs" style={{ color: '#9b7b72' }}>
            {uploading ? '업로드 중...' : '클릭하거나 드래그해서 사진을 추가해요'}
          </p>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
      </div>

      {/* 별점 */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold mb-4" style={{ color: '#9b7b72' }}>오늘 데이트 어땠어요?</h2>
        <div className="flex gap-4 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110"
              style={{ color: star <= rating ? '#c98d82' : '#e8d8d0' }}
            >
              ♥
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-xs mt-3" style={{ color: '#9b7b72' }}>
            {['', '별로였어요', '그저 그랬어요', '좋았어요', '너무 좋았어요', '완벽한 하루였어요'][rating]}
          </p>
        )}
      </div>

      {/* 피드백 */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold mb-3" style={{ color: '#9b7b72' }}>
          {role === 'boyfriend' ? '남자친구 후기' : '여자친구 후기'}
        </h2>
        <textarea
          className="input-romantic"
          rows={4}
          placeholder="오늘 데이트는 어땠나요?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ resize: 'none' }}
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">취소</button>
        <button type="submit" disabled={loading || uploading} className="btn-primary flex-1">
          {loading ? '저장 중...' : '기억 저장하기'}
        </button>
      </div>
    </form>
  )
}
