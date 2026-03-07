import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client, readClient } from '@/sanity/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const memories = await readClient.fetch(
    `*[_type == "dateMemory"] | order(createdAt desc) {
      _id,
      proposal->{ _id, title, proposedDate },
      photos[]{ _key, asset->{ url }, caption },
      boyfriendFeedback,
      girlfriendFeedback,
      rating,
      createdAt
    }`
  )

  return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await req.json()
  const { proposalId, boyfriendFeedback, girlfriendFeedback, rating } = body
  const role = (session.user as any)?.role

  // 역할에 따라 피드백 업데이트
  const memory = await client.create({
    _type: 'dateMemory',
    proposal: { _type: 'reference', _ref: proposalId },
    boyfriendFeedback: role === 'boyfriend' ? boyfriendFeedback : undefined,
    girlfriendFeedback: role === 'girlfriend' ? girlfriendFeedback : undefined,
    rating,
    createdAt: new Date().toISOString(),
  })

  // proposal 상태를 완료로 업데이트
  await client.patch(proposalId).set({ status: 'completed' }).commit()

  return NextResponse.json(memory)
}
