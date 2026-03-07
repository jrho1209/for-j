'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddFeedbackForm({ memoryId, role }: { memoryId: string; role: string }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const field = role === 'boyfriend' ? 'boyfriendFeedback' : 'girlfriendFeedback'
    await fetch(`/api/memories/${memoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: feedback }),
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-rose-600 mb-4">
        {role === 'boyfriend' ? '👦 남자친구 후기 남기기' : '👧 여자친구 후기 남기기'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="input-romantic"
          rows={3}
          placeholder="오늘 데이트는 어땠나요?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ resize: 'none' }}
          required
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '저장 중...' : '후기 남기기 💕'}
        </button>
      </form>
    </div>
  )
}
