import type { Metadata } from 'next'
import './globals.css'
import { auth } from '@/auth'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Our Date ♡',
  description: '우리만의 특별한 데이트 플랫폼',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        {session && <Header session={session} />}
        <main className={session ? 'pt-16 pb-16 sm:pb-0' : ''}>
          {children}
        </main>
      </body>
    </html>
  )
}
