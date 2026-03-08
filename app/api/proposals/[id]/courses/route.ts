import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client, readClient } from '@/sanity/client'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const courses = await readClient.fetch(
    `*[_type == "dateCourse" && proposal._ref == $id] | order(order asc) {
      _id, title, description, places, order
    }`,
    { id }
  )

  return NextResponse.json(courses)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, places, order } = body
  const course = await client.create({
    _type: 'dateCourse',
    proposal: { _type: 'reference', _ref: id },
    title,
    description,
    places: places || [],
    order: order || 0,
  })

  return NextResponse.json(course)
}
