'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('아이디 또는 비밀번호가 틀렸어요 💔')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-10 w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-9">
          <div className="text-2xl mb-5" style={{ color: '#c98d82', letterSpacing: '0.3em' }}>♡</div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#3d2c28' }}>
            우리의 데이트
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#9b7b72' }}>
            우리만을 위한 공간
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>아이디</label>
            <input
              className="input-romantic"
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9b7b72' }}>비밀번호</label>
            <input
              className="input-romantic"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-center text-xs py-2 rounded-xl" style={{ color: '#b5614e', background: '#f5ede6' }}>
              아이디 또는 비밀번호가 틀렸어요
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
