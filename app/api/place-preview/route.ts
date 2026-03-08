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

function parseApolloState(html: string): Record<string, any> | null {
  const apolloStart = html.indexOf('window.__APOLLO_STATE__')
  if (apolloStart < 0) return null
  const braceStart = html.indexOf('{', apolloStart)
  if (braceStart < 0) return null
  let depth = 0, braceEnd = braceStart
  for (let i = braceStart; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) { braceEnd = i + 1; break }
    }
  }
  try { return JSON.parse(html.slice(braceStart, braceEnd)) } catch { return null }
}

function extractCdnImages(html: string, apolloData: Record<string, any> | null, limit = 3): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  const addUrl = (url: string) => {
    if (urls.length >= limit) return
    if (!/\/20\d{6}/.test(url)) return
    const clean = url.split('?')[0]
    if (!seen.has(clean)) { seen.add(clean); urls.push(clean) }
  }

  if (apolloData) {
    const collect = (obj: unknown) => {
      if (urls.length >= limit) return
      if (typeof obj === 'string') {
        if (obj.includes('ldb-phinf.pstatic.net') && /\/20\d{6}/.test(obj)) addUrl(obj)
      } else if (Array.isArray(obj)) {
        for (const item of obj) collect(item)
      } else if (obj && typeof obj === 'object') {
        for (const val of Object.values(obj as Record<string, unknown>)) collect(val)
      }
    }
    collect(apolloData)
  }

  // 폴백: HTML 내 URL 인코딩된 이미지
  if (urls.length < limit) {
    const encodedRe = /src=https?(?:%3A|:)(?:%2F|\/){2}(ldb-phinf\.pstatic\.net(?:%2F|\/)[^"&\s<>]*)/gi
    let m: RegExpExecArray | null
    while ((m = encodedRe.exec(html)) !== null) {
      try {
        const decoded = decodeURIComponent(m[1])
        if (/\/20\d{6}/.test(decoded)) addUrl('https://' + decoded)
      } catch { /* 무시 */ }
      if (urls.length >= limit) break
    }
  }

  return urls
}

function isCoordValue(v: unknown): v is string | number {
  if (typeof v === 'number' && isFinite(v)) return true
  if (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v.trim())) return true
  return false
}

function isKoreanLng(v: number) { return v >= 124 && v <= 132 }
function isKoreanLat(v: number) { return v >= 33 && v <= 43 }

function extractCoords(apolloData: Record<string, any>): { x: string; y: string } | null {
  let result: { x: string; y: string } | null = null

  const search = (obj: unknown): boolean => {
    if (result) return true
    if (!obj || typeof obj !== 'object') return false

    if (!Array.isArray(obj)) {
      const rec = obj as Record<string, unknown>
      const { x, y } = rec
      if (isCoordValue(x) && isCoordValue(y)) {
        const nx = typeof x === 'number' ? x : parseFloat(x)
        const ny = typeof y === 'number' ? y : parseFloat(y)
        if (isKoreanLng(nx) && isKoreanLat(ny)) {
          result = { x: String(nx), y: String(ny) }
          return true
        }
      }
    }

    const values = Array.isArray(obj) ? obj : Object.values(obj)
    for (const val of values) {
      if (val && typeof val === 'object') {
        if (search(val)) return true
      }
    }
    return false
  }

  search(apolloData)
  return result
}

function extractCoordsFromHtml(html: string): { x: string; y: string } | null {
  // "longitude":127.xxx,"latitude":37.xxx 또는 "lng":127.xxx,"lat":37.xxx 패턴
  const patterns = [
    /["'](?:longitude|lng)["']\s*:\s*(\d+\.?\d*)\s*,\s*["'](?:latitude|lat)["']\s*:\s*(\d+\.?\d*)/,
    /["'](?:latitude|lat)["']\s*:\s*(\d+\.?\d*)\s*,\s*["'](?:longitude|lng)["']\s*:\s*(\d+\.?\d*)/,
    /["']x["']\s*:\s*["']?(\d+\.\d+)["']?\s*,\s*["']y["']\s*:\s*["']?(\d+\.\d+)["']?/,
    /["']y["']\s*:\s*["']?(\d+\.\d+)["']?\s*,\s*["']x["']\s*:\s*["']?(\d+\.\d+)["']?/,
  ]
  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) {
      const v1 = parseFloat(m[1]), v2 = parseFloat(m[2])
      // 첫 번째 패턴: lng, lat 순서 / 두 번째 패턴: lat, lng 순서
      if (pattern.source.startsWith('["\'](') || pattern.source.includes('longitude')) {
        // lng first
        if (isKoreanLng(v1) && isKoreanLat(v2)) return { x: String(v1), y: String(v2) }
      }
      // lat first
      if (isKoreanLng(v2) && isKoreanLat(v1)) return { x: String(v2), y: String(v1) }
      // x first (x=lng, y=lat)
      if (isKoreanLng(v1) && isKoreanLat(v2)) return { x: String(v1), y: String(v2) }
    }
  }
  return null
}

async function uploadImageToSanity(imageUrl: string, index: number): Promise<{ assetId: string; url: string } | null> {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://map.naver.com/',
      },
    })
    if (!imgRes.ok) return null
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    const asset = await client.assets.upload('image', buffer, {
      filename: `naver-place-${Date.now()}-${index}.jpg`,
      contentType,
    })
    return { assetId: asset._id, url: asset.url }
  } catch {
    return null
  }
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
        redirect: 'follow',
      })
      html = placeRes.ok ? await placeRes.text() : await res.text()
    } else {
      html = await res.text()
    }

    const rawTitle = parseMeta(html, 'og:title')
    const description = parseMeta(html, 'og:description')
    const ogImageUrl = parseMeta(html, 'og:image')

    // " : 네이버" 등 접미사 제거
    const title = rawTitle.replace(/\s*:\s*네이버.*$/, '').trim()

    // og:description에서 주소 파싱 (Naver: "카테고리 · 주소" 형식)
    // 리뷰 수("방문자리뷰 · 블로그리뷰") 형태면 주소 없음
    const parts = description.split(/\s*·\s*/)
    const isReviewDesc = description.includes('리뷰')
    const address = (!isReviewDesc && parts.length > 1) ? parts.slice(1).join(' ').trim() : ''
    const category = (!isReviewDesc && parts.length > 1) ? parts[0].trim() : ''

    // 4. Apollo state 파싱 (이미지 + 좌표 동시 추출)
    const apolloData = parseApolloState(html)
    const cdnImages = extractCdnImages(html, apolloData, 3)
    const coords = (apolloData ? extractCoords(apolloData) : null) || extractCoordsFromHtml(html)

    // CDN 이미지가 있으면 우선 사용, 없으면 og:image 폴백
    const allImageUrls: string[] = cdnImages.length > 0
      ? cdnImages.slice(0, 3)
      : ogImageUrl ? [ogImageUrl] : []

    // 5. 이미지들을 병렬로 Sanity에 업로드 (최대 3개)
    const uploadTargets = allImageUrls.slice(0, 3)
    const uploadResults = await Promise.all(
      uploadTargets.map((imgUrl, i) => uploadImageToSanity(imgUrl, i))
    )

    const uploaded = uploadResults.filter((r): r is { assetId: string; url: string } => r !== null)
    const assetIds = uploaded.map(r => r.assetId)
    const imageUrls = uploaded.map(r => r.url)

    // 하위 호환: 기존 단수 필드도 함께 반환
    const assetId = assetIds[0]
    const imageUrl = imageUrls[0] || ogImageUrl

    return NextResponse.json({
      name: title,
      description: category,
      address,
      imageUrl,
      assetId,
      imageUrls,
      assetIds,
      // Naver 좌표 (x=경도, y=위도)
      ...(coords ? { lng: parseFloat(coords.x), lat: parseFloat(coords.y) } : {}),
    })
  } catch {
    return NextResponse.json({ error: '정보를 가져오지 못했어요.' }, { status: 500 })
  }
}
