// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PublicCalendarPage } from './pages/PublicCalendarPage'
import { NoticeListPage } from './pages/NoticeListPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminCommissionFormPage } from './pages/AdminCommissionFormPage'
import { AdminNoticeFormPage } from './pages/AdminNoticeFormPage'
import { NoticeDetailPage } from './pages/NoticeDetailPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAdmin } from './auth/RequireAdmin'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            {/* 공개 페이지 */}
            <Route path="/" element={<PublicCalendarPage />} />
            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/notices/:id" element={<NoticeDetailPage />} />

            {/* 관리자 로그인 */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* 관리자 전용 페이지 */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/new"
              element={
                <RequireAdmin>
                  <AdminCommissionFormPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/notices/new"
              element={
                <RequireAdmin>
                  <AdminNoticeFormPage />
                </RequireAdmin>
              }
            />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}
