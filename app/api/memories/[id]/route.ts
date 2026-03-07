import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client, readClient } from '@/sanity/client'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const memory = await readClient.fetch(
    `*[_type == "dateMemory" && _id == $id][0]{
      _id,
      proposal->{ _id, title, proposedDate, selectedCourseId },
      photos[]{ _key, asset->{ url }, caption, alt },
      boyfriendFeedback,
      girlfriendFeedback,
      rating,
      createdAt
    }`,
    { id }
  )

  if (!memory) return NextResponse.json({ error: '기억을 찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json(memory)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const updated = await client.patch(id).set(body).commit()
  return NextResponse.json(updated)
}
