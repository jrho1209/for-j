'use client'

import { useEffect, useRef, useState } from 'react'

interface PlaceWithCoords {
  name: string
  lat: number
  lng: number
}

interface Course {
  _id: string
  title: string
  places: PlaceWithCoords[]
}

interface Props {
  courses: {
    _id: string
    title: string
    places: Array<{ name: string; lat?: number; lng?: number }>
  }[]
  selectedCourseId?: string
}

const COLORS = ['#b5614e', '#5c6fbf', '#4a8f6a', '#a07840', '#8b6fbf']

declare global {
  interface Window {
    naver: any
  }
}

function useNaverMaps() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (window.naver?.maps) { setReady(true); return }
    const interval = setInterval(() => {
      if (window.naver?.maps) { setReady(true); clearInterval(interval) }
    }, 200)
    return () => clearInterval(interval)
  }, [])
  return ready
}

export default function CourseMap({ courses, selectedCourseId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const naverReady = useNaverMaps()

  const coursesWithCoords: Course[] = courses
    .map(c => ({
      ...c,
      places: c.places.filter(
        (p): p is PlaceWithCoords => typeof p.lat === 'number' && typeof p.lng === 'number'
      ),
    }))
    .filter(c => c.places.length > 0)

  const [activeCourseId, setActiveCourseId] = useState(
    selectedCourseId && coursesWithCoords.find(c => c._id === selectedCourseId)
      ? selectedCourseId
      : coursesWithCoords[0]?._id || ''
  )

  const activeCourse = coursesWithCoords.find(c => c._id === activeCourseId) || coursesWithCoords[0]
  const colorIndex = coursesWithCoords.findIndex(c => c._id === activeCourseId)
  const color = COLORS[colorIndex % COLORS.length] || COLORS[0]

  useEffect(() => {
    if (!naverReady || !activeCourse || !mapRef.current) return

    const naver = window.naver
    const places = activeCourse.places
    if (places.length === 0) return

    const center = new naver.maps.LatLng(places[0].lat, places[0].lng)

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT, style: naver.maps.ZoomControlStyle.SMALL },
      })
    }

    // Clear old markers and polylines
    markersRef.current.forEach(m => m.setMap(null))
    polylinesRef.current.forEach(p => p.setMap(null))
    markersRef.current = []
    polylinesRef.current = []

    const bounds = new naver.maps.LatLngBounds()

    places.forEach((place, i) => {
      const pos = new naver.maps.LatLng(place.lat, place.lng)
      bounds.extend(pos)

      const marker = new naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};color:#fff;
            font-size:12px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            border:2px solid #fff;
            font-family:-apple-system,sans-serif;
          ">${i + 1}</div>`,
          anchor: new naver.maps.Point(14, 14),
        },
      })

      const infoWindow = new naver.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;font-weight:600;color:#3d2c28;white-space:nowrap;font-family:-apple-system,sans-serif;">${place.name}</div>`,
        borderColor: '#e8d8d0',
        borderWidth: 1,
        disableAnchor: false,
        backgroundColor: '#fffdf9',
      })

      naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindow.getMap()) infoWindow.close()
        else infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    if (places.length > 1) {
      const path = places.map(p => new naver.maps.LatLng(p.lat, p.lng))
      const polyline = new naver.maps.Polyline({
        path,
        map: mapInstanceRef.current,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 2.5,
        strokeStyle: 'shortdash',
      })
      polylinesRef.current.push(polyline)
    }

    mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
  }, [activeCourseId, naverReady])

  if (coursesWithCoords.length === 0) return null

  return (
    <div className="card overflow-hidden">
      {/* 코스 탭 */}
      {coursesWithCoords.length > 1 && (
        <div className="flex border-b" style={{ borderColor: '#f0e8e0' }}>
          {coursesWithCoords.map((course, i) => (
            <button
              key={course._id}
              onClick={() => setActiveCourseId(course._id)}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={{
                color: activeCourseId === course._id ? COLORS[i % COLORS.length] : '#9b7b72',
                borderBottom: activeCourseId === course._id ? `2px solid ${COLORS[i % COLORS.length]}` : '2px solid transparent',
                background: 'transparent',
              }}
            >
              코스 {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 지도 */}
      <div ref={mapRef} style={{ height: 260, width: '100%', background: '#f5f0ea' }} />

      {/* 장소 순서 목록 */}
      {activeCourse && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {activeCourse.places.map((place, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: color, color: '#fff', fontSize: 10 }}
              >
                {i + 1}
              </div>
              <span className="text-xs" style={{ color: '#3d2c28' }}>{place.name}</span>
              {i < activeCourse.places.length - 1 && (
                <span style={{ color: '#c4a89f', fontSize: 10 }}>→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
