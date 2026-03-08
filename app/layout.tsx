import type { Metadata } from 'next'
import Script from 'next/script'
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
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}`}
          strategy="afterInteractive"
        />
        {session && <Header session={session} />}
        <main className={session ? 'pt-16 pb-16 sm:pb-0' : ''}>
          {children}
        </main>
      </body>
    </html>
  )
}
