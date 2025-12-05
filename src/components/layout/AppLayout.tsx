// src/components/layout/AppLayout.tsx
import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

interface Props {
  children: ReactNode
}

export function AppLayout({ children }: Props) {
  const { isAdmin, user } = useAuth()

  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            LUCKY DRAW <span className="text-teal-500">CALENDAR</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 transition-colors'
              }
            >
              캘린더
            </NavLink>
            <NavLink
              to="/notices"
              className={({ isActive }) =>
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 transition-colors'
              }
            >
              공지사항
            </NavLink>
            <NavLink
              to="https://ld-calendar.github.io/luckydrawsample/"
              target="_blank"
              className={({ isActive }) =>
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'hover:text-slate-900 dark:hover:text-slate-200 transition-colors'
              }
            >
              샘플 사이트
            </NavLink>

            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'hover:text-slate-900 dark:hover:text-slate-200 transition-colors'
                  }
                >
                  관리자
                </NavLink>
                {/* 계정 정보 + 관리자 여부 */}
                <div className="hidden flex-col text-xs text-slate-400 sm:flex">
                  <span className="truncate max-w-[160px]">
                    {user?.email}
                  </span>
                  <span className="font-semibold text-teal-500">
                    관리자 계정
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:border-teal-500 hover:text-teal-600 dark:border-slate-700 dark:hover:border-teal-400"
                >
                  로그아웃
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
