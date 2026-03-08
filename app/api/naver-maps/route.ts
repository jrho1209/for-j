import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
  const clientSecret = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new NextResponse('Missing Naver Maps credentials', { status: 500 })
  }

  const res = await fetch(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`,
    {
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret,
      },
    }
  )

  if (!res.ok) {
    return new NextResponse('Failed to load Naver Maps script', { status: res.status })
  }

  const script = await res.text()

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
