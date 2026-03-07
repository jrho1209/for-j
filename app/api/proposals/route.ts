import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client, readClient } from '@/sanity/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const proposals = await readClient.fetch(
    `*[_type == "dateProposal"] | order(createdAt desc) {
      _id, title, proposedDate, proposedTime, message, status, selectedCourseId, createdAt
    }`
  )

  return NextResponse.json(proposals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const role = (session.user as any)?.role
  const body = await req.json()
  const { title, proposedDate, proposedTime, message } = body

  const proposal = await client.create({
    _type: 'dateProposal',
    title,
    proposedDate,
    proposedTime,
    message,
    status: 'pending',
    createdBy: role,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json(proposal)
}
