import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client, readClient } from '@/sanity/client'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const proposal = await readClient.fetch(
    `*[_type == "dateProposal" && _id == $id][0]{
      _id, title, proposedDate, proposedTime, message, status, selectedCourseId, createdAt
    }`,
    { id }
  )

  if (!proposal) return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json(proposal)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const role = (session.user as any)?.role

  // 가능 여부 응답은 여자친구만
  if (body.status && ['accepted', 'declined'].includes(body.status) && role !== 'girlfriend') {
    return NextResponse.json({ error: '여자친구만 응답할 수 있어요.' }, { status: 403 })
  }

  const updated = await client.patch(id).set(body).commit()
  return NextResponse.json(updated)
}
