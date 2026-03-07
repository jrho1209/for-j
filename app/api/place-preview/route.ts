import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { client } from '@/sanity/client'

function parseMeta(html: string, property: string): string {
  const match =
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
  const value = match?.[1] ?? ''
  // HTML 엔티티 디코딩
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL이 없습니다.' }, { status: 400 })

  const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  const COMMON_HEADERS = { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'ko-KR,ko;q=0.9' }

  try {
    // 1. 데스크탑 UA로 리다이렉트 따라가기 (모바일 UA는 appLink로 리다이렉트되어 place ID 파싱 불가)
    const res = await fetch(url, {
      headers: { ...COMMON_HEADERS, 'User-Agent': DESKTOP_UA },
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json({ error: '페이지를 불러올 수 없어요.' }, { status: 400 })
    }

    // 2. 최종 URL에서 Naver Place ID 추출
    const finalUrl = res.url
    const placeIdMatch =
      finalUrl.match(/\/entry\/place\/(\d+)/) ||
      finalUrl.match(/\/place\/(\d+)/) ||
      finalUrl.match(/[?&]pinId=(\d+)/) ||
      finalUrl.match(/[?&]id=(\d+)/)
    const placeId = placeIdMatch?.[1]

    // 3. Place ID가 있으면 모바일 플레이스 페이지에서 재파싱 (실제 사진 있음)
    let html: string
    if (placeId) {
      const placeRes = await fetch(`https://m.place.naver.com/place/${placeId}/home`, {
        headers: { ...COMMON_HEADERS, 'User-Agent': MOBILE_UA },
      })
      html = placeRes.ok ? await placeRes.text() : await res.text()
    } else {
      html = await res.text()
    }

    const rawTitle = parseMeta(html, 'og:title')
    const description = parseMeta(html, 'og:description')
    const imageUrl = parseMeta(html, 'og:image')

    // " : 네이버" 등 접미사 제거
    const title = rawTitle.replace(/\s*:\s*네이버.*$/, '').trim()

    // og:description에서 주소 파싱 (Naver: "카테고리 · 주소" 형식)
    // 리뷰 수("방문자리뷰 · 블로그리뷰") 형태면 주소 없음
    const parts = description.split(/\s*·\s*/)
    const isReviewDesc = description.includes('리뷰')
    const address = (!isReviewDesc && parts.length > 1) ? parts.slice(1).join(' ').trim() : ''
    const category = (!isReviewDesc && parts.length > 1) ? parts[0].trim() : ''

    // OG 이미지를 Sanity에 업로드
    let assetId: string | undefined
    let sanityImageUrl: string | undefined

    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://map.naver.com/',
          },
        })
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          const asset = await client.assets.upload('image', buffer, {
            filename: `naver-place-${Date.now()}.jpg`,
            contentType,
          })
          assetId = asset._id
          sanityImageUrl = asset.url
        }
      } catch {
        // 이미지 업로드 실패는 무시하고 텍스트 정보만 반환
      }
    }

    return NextResponse.json({
      name: title,
      description: category,
      address,
      imageUrl: sanityImageUrl || imageUrl,
      assetId,
    })
  } catch {
    return NextResponse.json({ error: '정보를 가져오지 못했어요.' }, { status: 500 })
  }
}
