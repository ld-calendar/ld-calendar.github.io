// src/auth/RequireAdmin.tsx
import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAdmin({ children }: { children: ReactElement }) {
  const { loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500 dark:border-slate-800 dark:border-t-teal-400" />
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          권한 확인 중...
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}