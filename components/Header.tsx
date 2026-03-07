'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'

interface HeaderProps {
  session: Session
}

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname()
  const role = (session.user as any)?.role
  const name = session.user?.name

  const navItems = [
    { href: '/', label: '홈' },
    { href: '/proposals', label: '데이트' },
    { href: '/memories', label: '우리의 기억' },
  ]

  return (
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

        <nav className="flex items-center gap-1">
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
              {item.label}
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
  )
}
