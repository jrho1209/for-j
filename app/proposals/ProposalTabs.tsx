'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '답장 대기 중', color: '#b5614e', bg: '#f5ede6' },
  accepted: { label: '수락됨', color: '#8b6fbf', bg: '#f2eeff' },
  declined: { label: '거절됨', color: '#9b7b72', bg: '#f0ebe8' },
  selecting: { label: '코스 선택 중', color: '#a07840', bg: '#f5f0e6' },
  confirmed: { label: '확정', color: '#4a8f6a', bg: '#eaf5ef' },
  completed: { label: '완료', color: '#5c6fbf', bg: '#eef0f9' },
  cancelled: { label: '취소됨', color: '#a09090', bg: '#f0ebe8' },
}

interface Proposal {
  _id: string
  title: string
  proposedDate?: string
  proposedTime?: string
  message?: string
  status: string
  createdBy?: string
  createdAt: string
}

export default function ProposalTabs({
  proposals,
  role,
}: {
  proposals: Proposal[]
  role: string
}) {
  const [tab, setTab] = useState<'sent' | 'received'>('received')

  const otherRole = role === 'boyfriend' ? 'girlfriend' : 'boyfriend'

  // 내가 보낸 신청: createdBy === role (또는 createdBy 없고 남자친구면 내거로 간주)
  const sent = proposals.filter((p) => p.createdBy === role)
  // 받은 신청: 상대방이 만든 것 (createdBy === otherRole)
  const received = proposals.filter((p) => p.createdBy === otherRole)

  const list = tab === 'sent' ? sent : received

  return (
    <div>
      {/* 탭 */}
      <div
        className="flex mb-6 rounded-xl overflow-hidden"
        style={{ border: '1px solid #e8d8d0', background: '#fdf8f5' }}
      >
        <button
          onClick={() => setTab('received')}
          className="flex-1 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: tab === 'received' ? '#fff' : 'transparent',
            color: tab === 'received' ? '#3d2c28' : '#9b7b72',
            boxShadow: tab === 'received' ? '0 1px 4px #0000000d' : 'none',
          }}
        >
          받은 신청
          {received.length > 0 && (
            <span
              className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: '#f5ede6', color: '#b5614e' }}
            >
              {received.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className="flex-1 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: tab === 'sent' ? '#fff' : 'transparent',
            color: tab === 'sent' ? '#3d2c28' : '#9b7b72',
            boxShadow: tab === 'sent' ? '0 1px 4px #0000000d' : 'none',
          }}
        >
          내가 보낸 신청
          {sent.length > 0 && (
            <span
              className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: '#f0ebe8', color: '#9b7b72' }}
            >
              {sent.length}
            </span>
          )}
        </button>
      </div>

      {/* 목록 */}
      {list.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="text-xl mb-3" style={{ color: '#e8d8d0' }}>♡</div>
          <p className="text-sm" style={{ color: '#9b7b72' }}>
            {tab === 'received' ? '아직 받은 신청이 없어요' : '아직 보낸 신청이 없어요'}
          </p>
          {tab === 'sent' && (
            <Link href="/proposals/new" className="btn-primary mt-5 inline-block">
              첫 데이트 신청하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((proposal) => {
            const config = statusConfig[proposal.status] || statusConfig.pending
            return (
              <Link
                key={proposal._id}
                href={`/proposals/${proposal._id}`}
                className="card p-5 block hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-sm truncate" style={{ color: '#3d2c28' }}>{proposal.title}</h2>
                    {proposal.proposedDate && (
                      <p className="text-xs mt-1" style={{ color: '#c4a89f' }}>
                        {format(new Date(proposal.proposedDate), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                        {proposal.proposedTime && ` · ${proposal.proposedTime}`}
                      </p>
                    )}
                    {proposal.message && (
                      <p className="text-xs mt-2 line-clamp-1 italic" style={{ color: '#9b7b72' }}>
                        "{proposal.message}"
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: config.color, background: config.bg }}
                  >
                    {config.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
