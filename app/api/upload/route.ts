import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client } from '@/sanity/client'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {
    filename: file.name,
    contentType: file.type,
  })

  return NextResponse.json({ assetId: asset._id, url: asset.url })
}
