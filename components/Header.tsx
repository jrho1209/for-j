'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { Home, CalendarHeart, BookImage } from 'lucide-react'

interface HeaderProps {
  session: Session
}

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname()
  const name = session.user?.name

  const navItems = [
    { href: '/', label: '홈', icon: Home },
    { href: '/proposals', label: '데이트', icon: CalendarHeart },
    { href: '/memories', label: '기억', icon: BookImage },
  ]

  return (
    <>
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{
        background: 'rgba(249,246,242,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e8d8d0',
      }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[#b5614e] text-lg tracking-tight">
            <span style={{ fontSize: '1rem' }}>♡</span>
            <span>우리의 데이트</span>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: pathname === item.href ? 'linear-gradient(135deg,#b5614e,#9e4f3d)' : 'transparent',
                  color: pathname === item.href ? '#fffdf9' : '#9b7b72',
                }}
              >
                {item.href === '/memories' ? '우리의 기억' : item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: '#9b7b72' }}>{name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs transition-colors"
              style={{ color: '#c4a89f' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#b5614e')}
              onMouseLeave={e => (e.currentTarget.style.color = '#c4a89f')}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭 네비게이션 */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: 'rgba(249,246,242,0.96)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid #e8d8d0',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} style={{ color: isActive ? '#b5614e' : '#c4a89f' }} />
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? '#b5614e' : '#c4a89f' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
