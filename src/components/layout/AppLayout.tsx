// src/components/layout/AppLayout.tsx
import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

interface Props {
  children: ReactNode
}

export function AppLayout({ children }: Props) {
  const { isAdmin, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    setMobileOpen(false)
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* ✅ 모든 뷰에서 한 줄짜리 헤더 (로고 + 우측 영역) */}
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
              onClick={closeMobile}
            >
              LUCKY DRAW <span className="text-teal-500">CALENDAR</span>
            </Link>

            {/* 데스크톱: 기존 메뉴 + 계정 영역 */}
            <div className="hidden items-center gap-6 text-sm font-medium text-slate-500 sm:flex dark:text-slate-400">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'transition-colors hover:text-slate-900 dark:hover:text-slate-200'
                }
              >
                캘린더
              </NavLink>
              <NavLink
                to="/notices"
                className={({ isActive }) =>
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'transition-colors hover:text-slate-900 dark:hover:text-slate-200'
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
                    : 'transition-colors hover:text-slate-900 dark:hover:text-slate-200'
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
                        : 'transition-colors hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  >
                    관리자
                  </NavLink>
                  <div className="flex flex-col text-xs text-slate-400">
                    <span className="max-w-[160px] truncate">
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
            </div>

            {/* ✅ 모바일: 햄버거 버튼만 (메뉴는 아래로 따로) */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-teal-500 hover:text-teal-600 sm:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-400 dark:hover:text-teal-400"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">메뉴 열기</span>
              {/* 간단한 햄버거 아이콘 / X 아이콘 */}
              {mobileOpen ? (
                <span className="text-lg leading-none">&times;</span>
              ) : (
                <span className="text-xl leading-none">&#9776;</span>
              )}
            </button>
          </div>

          {/* ✅ 모바일 드롭다운 메뉴 (헤더 한 줄 유지, 메뉴는 헤더 아래 레이어) */}
          {mobileOpen && (
            <nav className="mb-2 flex flex-col gap-2 border-t border-slate-200 py-3 text-sm font-medium text-slate-600 sm:hidden dark:border-slate-800 dark:text-slate-300">
              <NavLink
                to="/"
                onClick={closeMobile}
                className={({ isActive }) =>
                  (isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-300') +
                  ' px-1 py-1'
                }
              >
                캘린더
              </NavLink>
              <NavLink
                to="/notices"
                onClick={closeMobile}
                className={({ isActive }) =>
                  (isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-300') +
                  ' px-1 py-1'
                }
              >
                공지사항
              </NavLink>
              <a
                href="https://ld-calendar.github.io/luckydrawsample/"
                target="_blank"
                rel="noreferrer"
                className="px-1 py-1 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                onClick={closeMobile}
              >
                샘플 사이트
              </a>

              {isAdmin && (
                <>
                  <NavLink
                    to="/admin"
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      (isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-300') +
                      ' px-1 py-1'
                    }
                  >
                    관리자
                  </NavLink>
                  <div className="mt-1 border-t border-slate-100 pt-2 text-xs text-slate-400 dark:border-slate-700">
                    <div className="max-w-[200px] truncate">
                      {user?.email}
                    </div>
                    <div className="font-semibold text-teal-500">
                      관리자 계정
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-2 inline-flex rounded-full border border-slate-300 px-3 py-1 text-[11px] text-slate-500 hover:border-teal-500 hover:text-teal-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-teal-400 dark:hover:text-teal-300"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
