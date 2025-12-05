// src/pages/NoticeDetailPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchNotices, deleteNotice } from '../api/sheet'
import type { Notice } from '../types'
import { normalizeNotices } from '../utils/notice'
import { useAuth } from '../auth/AuthProvider'

export function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('잘못된 접근입니다.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const res = await fetchNotices()
      if (!res.ok) {
        setError(`공지 데이터를 불러오지 못했습니다: ${res.error}`)
        setLoading(false)
        return
      }

      const normalized = normalizeNotices(res.data)
      const found = normalized.find((n) => n.id === id)
      if (!found) {
        setError('해당 공지를 찾을 수 없습니다.')
        setLoading(false)
        return
      }
      setNotice(found)
      setLoading(false)
    }

    load()
  }, [id])

  const handleEdit = () => {
    if (!notice) return
    navigate(`/admin/notices/new?id=${encodeURIComponent(notice.id)}`)
  }

  const handleDelete = async () => {
    if (!notice || deleting) return
    const ok = window.confirm('정말 이 공지를 삭제하시겠습니까?')
    if (!ok) return

    setDeleting(true)
    const res = await deleteNotice(notice.id)
    setDeleting(false)

    if (!res.ok) {
      alert(`삭제 실패: ${res.error}`)
      return
    }

    alert('공지사항이 삭제되었습니다.')
    navigate('/notices')
  }

  return (
    <div className="page-shell">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">
            {notice ? notice.title : '공지사항'}
          </h1>
          {notice && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{notice.createdAt.slice(0, 10)}</span>
              {notice.isPinned && (
                <span className="badge-teal">상단 고정</span>
              )}
              {!notice.isActive && (
                <span className="badge-muted">비공개</span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {/* 목록 버튼은 누구나 */}
          <Link to="/notices" className="btn btn-outline btn-sm">
            목록
          </Link>

          {/* ✅ 수정/삭제는 관리자만 */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                disabled={!notice}
                className="btn btn-primary btn-sm disabled:opacity-50"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!notice || deleting}
                className="btn btn-danger btn-sm disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </>
          )}
        </div>
      </header>

      {loading && (
        <div className="py-20 text-center text-slate-500">
          공지를 불러오는 중입니다...
        </div>
      )}
      {error && (
        <div className="py-20 text-center text-red-500">{error}</div>
      )}

      {!loading && !error && notice && (
        <article className="notice-body prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 dark:prose-invert dark:text-slate-200">
          <div dangerouslySetInnerHTML={{ __html: notice.body }} />
        </article>
      )}
    </div>
  )
}
