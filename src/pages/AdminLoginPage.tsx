// src/pages/AdminLoginPage.tsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../auth/AuthProvider'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any

  useEffect(() => {
    if (isAdmin) {
      const redirectTo =
        location.state?.from?.pathname || '/admin'
      navigate(redirectTo, { replace: true })
    }
  }, [isAdmin, navigate, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged → isAdmin 갱신 → 위 useEffect에서 redirect
    } catch (err: any) {
      console.error(err)
      setError(
        '로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Admin Login</h1>
        <p className="page-subtitle">
          관리자만 공지 및 커미션을 관리할 수 있습니다.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="form-label">이메일</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <label className="form-label">비밀번호</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {submitting ? '로그인 중...' : '로그인'}
        </button>

        <p className="text-center text-xs text-slate-400">
          일반 사용자는 이 페이지를 사용하지 않습니다.
        </p>

        <div className="text-center text-xs text-slate-400">
          <Link
            to="/"
            className="text-teal-500 hover:text-teal-600"
          >
            ← 메인 캘린더로 돌아가기
          </Link>
        </div>
      </form>
    </div>
  )
}
