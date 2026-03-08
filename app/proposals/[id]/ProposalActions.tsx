'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
}

interface Proposal {
  _id: string
  status: string
  selectedCourseId?: string
}

interface ProposalActionsProps {
  proposal: Proposal
  role: string
  courses: Course[]
  memoryId?: string
}

const CANCELLABLE = ['pending', 'accepted', 'declined', 'selecting']

export default function ProposalActions({ proposal, role, courses }: ProposalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(proposal.selectedCourseId || '')

  const updateStatus = async (status: string, extra?: object) => {
    setLoading(true)
    await fetch(`/api/proposals/${proposal._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    router.refresh()
    setLoading(false)
  }

  const confirmCourse = async () => {
    if (!selectedCourse) return
    setLoading(true)
    await fetch(`/api/proposals/${proposal._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed', selectedCourseId: selectedCourse }),
    })
    router.refresh()
    setLoading(false)
  }

  const cancelButton = role === 'boyfriend' && CANCELLABLE.includes(proposal.status)
    ? <CancelButton proposalId={proposal._id} loading={loading} onCancel={() => updateStatus('cancelled')} />
    : null

  // 여자친구 - 대기 중 상태 (코스가 있으면 바로 선택)
  if (role === 'girlfriend' && proposal.status === 'pending') {
    if (courses.length > 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-center" style={{ color: '#9b7b72' }}>
            데이트 신청이 왔어요. 코스를 골라 수락해요
          </p>
          <div className="space-y-2">
            {courses.map((course) => (
              <label
                key={course._id}
                className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selectedCourse === course._id ? '#f9f4f0' : '#fffdf9',
                  border: `1.5px solid ${selectedCourse === course._id ? '#b5614e' : '#e8d8d0'}`,
                }}
              >
                <input
                  type="radio"
                  name="course"
                  value={course._id}
                  checked={selectedCourse === course._id}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  style={{ accentColor: '#b5614e' }}
                />
                <span className="text-sm font-medium" style={{ color: '#3d2c28' }}>{course.title}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => updateStatus('declined')} disabled={loading} className="btn-secondary flex-1">
              이번엔 안 될 것 같아
            </button>
            <button
              onClick={() => selectedCourse && updateStatus('confirmed', { selectedCourseId: selectedCourse })}
              disabled={loading || !selectedCourse}
              className="btn-primary flex-1"
            >
              {loading ? '확정 중...' : '이 코스로 갈게요 ♡'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-center mb-3" style={{ color: '#9b7b72' }}>
          데이트 신청이 왔어요. 가능한가요?
        </p>
        <div className="flex gap-3">
          <button onClick={() => updateStatus('declined')} disabled={loading} className="btn-secondary flex-1">
            이번엔 안 될 것 같아
          </button>
          <button onClick={() => updateStatus('selecting')} disabled={loading} className="btn-primary flex-1">
            좋아, 갈게 ♡
          </button>
        </div>
      </div>
    )
  }

  // 여자친구 - 코스 선택 상태
  if (role === 'girlfriend' && proposal.status === 'selecting' && courses.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-center" style={{ color: '#9b7b72' }}>어떤 코스가 마음에 들어요?</p>
        <div className="space-y-2">
          {courses.map((course) => (
            <label
              key={course._id}
              className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
              style={{
                background: selectedCourse === course._id ? '#f9f4f0' : '#fffdf9',
                border: `1.5px solid ${selectedCourse === course._id ? '#b5614e' : '#e8d8d0'}`,
              }}
            >
              <input
                type="radio"
                name="course"
                value={course._id}
                checked={selectedCourse === course._id}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ accentColor: '#b5614e' }}
              />
              <span className="text-sm font-medium" style={{ color: '#3d2c28' }}>{course.title}</span>
            </label>
          ))}
        </div>
        <button onClick={confirmCourse} disabled={loading || !selectedCourse} className="btn-primary w-full">
          {loading ? '확정 중...' : '이 코스로 갈게요'}
        </button>
      </div>
    )
  }

  // 여자친구 - 코스 선택 상태이지만 코스가 없음
  if (role === 'girlfriend' && proposal.status === 'selecting' && courses.length === 0) {
    return (
      <div className="text-center text-sm py-4" style={{ color: '#9b7b72' }}>
        남자친구가 코스를 준비 중이에요
      </div>
    )
  }

  // 남자친구 - 코스 선택 대기
  if (role === 'boyfriend' && proposal.status === 'selecting') {
    return (
      <div>
        <div className="text-center text-sm py-2" style={{ color: '#9b7b72' }}>
          여자친구가 코스를 선택하고 있어요 ♡
        </div>
        {cancelButton}
      </div>
    )
  }

  // 남자친구 - 대기 중 (수정 가능)
  if (role === 'boyfriend' && proposal.status === 'pending') {
    return (
      <div className="space-y-3">
        <Link
          href={`/proposals/${proposal._id}/edit`}
          className="btn-secondary block text-center text-sm"
        >
          수정하기
        </Link>
        {cancelButton}
      </div>
    )
  }

  // 남자친구 - 수락 / 거절
  if (role === 'boyfriend' && ['accepted', 'declined'].includes(proposal.status)) {
    return <div>{cancelButton}</div>
  }

  // 확정 상태
  if (proposal.status === 'confirmed') {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-medium" style={{ color: '#4a8f6a' }}>데이트가 확정됐어요</p>
        <p className="text-xs mt-1" style={{ color: '#9b7b72' }}>설레는 날을 기다려요 ♡</p>
      </div>
    )
  }

  // 완료 상태
  if (proposal.status === 'completed') {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-medium" style={{ color: '#5c6fbf' }}>완료된 데이트에요</p>
        <p className="text-xs mt-1" style={{ color: '#9b7b72' }}>소중한 기억이 담겨있어요</p>
      </div>
    )
  }

  // 취소됨 상태
  if (proposal.status === 'cancelled') {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-medium" style={{ color: '#a09090' }}>취소된 신청이에요</p>
      </div>
    )
  }

  return null
}

function CancelButton({ proposalId, loading, onCancel }: { proposalId: string; loading: boolean; onCancel: () => void }) {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid #e8d8d0' }}>
        <p className="text-xs flex-1" style={{ color: '#9b7b72' }}>정말 취소할까요?</p>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: '#9b7b72', border: '1px solid #e8d8d0' }}
        >
          아니요
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: '#b5614e', border: '1px solid #b5614e' }}
        >
          {loading ? '취소 중...' : '취소하기'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 text-right" style={{ borderTop: '1px solid #e8d8d0' }}>
      <button
        onClick={() => setConfirm(true)}
        className="text-xs transition-colors"
        style={{ color: '#c4a89f' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
        onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}
      >
        신청 취소
      </button>
    </div>
  )
}
