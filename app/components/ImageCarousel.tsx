'use client'

import { useRef, useState } from 'react'

interface ImageCarouselProps {
  images: string[]
  href?: string
}

const PEEK = 68 // 메인 이미지 너비(%), 나머지는 옆 이미지 peek

export default function ImageCarousel({ images, href }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) return null

  const single = images.length === 1

  const scrollTo = (idx: number) => {
    const newIdx = Math.max(0, Math.min(idx, images.length - 1))
    setCurrent(newIdx)
    const track = trackRef.current
    if (!track) return
    // 각 아이템 너비 = 컨테이너의 PEEK% + gap 8px
    const itemW = track.clientWidth * (PEEK / 100) + 8
    track.scrollTo({ left: newIdx * itemW, behavior: 'smooth' })
  }

  const prev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); scrollTo(current - 1) }
  const next = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); scrollTo(current + 1) }

  // 스크롤로 직접 넘겼을 때 dot 동기화
  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const itemW = track.clientWidth * (PEEK / 100) + 8
    const idx = Math.round(track.scrollLeft / itemW)
    setCurrent(Math.max(0, Math.min(idx, images.length - 1)))
  }

  const imgStyle = (src: string): React.CSSProperties => ({
    flexShrink: 0,
    width: single ? '100%' : `${PEEK}%`,
    height: 176,
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: 12,
    scrollSnapAlign: 'start',
  })

  return (
    <div className="relative mb-1.5">
      {/* 이미지 트랙 */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: single ? 'hidden' : 'scroll',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          // 마지막 이미지 오른쪽 여백으로 peek 맥락 유지
          paddingRight: single ? 0 : 8,
        } as React.CSSProperties}
      >
        {images.map((src, i) =>
          href ? (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...imgStyle(src), display: 'block', overflow: 'hidden' }}
            />
          ) : (
            <div key={i} style={imgStyle(src)} />
          )
        )}
      </div>

      {/* 좌우 화살표 */}
      {!single && (
        <>
          {current > 0 && (
            <button
              onClick={prev}
              aria-label="이전"
              style={{
                position: 'absolute', left: 8, top: 88, transform: 'translateY(-50%)',
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(0,0,0,0.35)', color: '#fff',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, lineHeight: 1,
              }}
            >‹</button>
          )}
          {current < images.length - 1 && (
            <button
              onClick={next}
              aria-label="다음"
              style={{
                position: 'absolute', right: 8, top: 88, transform: 'translateY(-50%)',
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(0,0,0,0.35)', color: '#fff',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, lineHeight: 1,
              }}
            >›</button>
          )}
        </>
      )}

      {/* 닷 인디케이터 (이미지 아래) */}
      {!single && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); scrollTo(i) }}
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? '#b5614e' : '#e0cec8',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
