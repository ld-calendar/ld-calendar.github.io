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

  // ✅ 이전 글 / 다음 글
  const [prevNotice, setPrevNotice] = useState<Notice | null>(null)
  const [nextNotice, setNextNotice] = useState<Notice | null>(null)

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

      // 현재 글 찾기 (활성/비활성 상관 없이)
      const current = normalized.find((n) => n.id === id)
      if (!current) {
        setError('해당 공지를 찾을 수 없습니다.')
        setLoading(false)
        return
      }
      setNotice(current)

      // 활성(notice.isActive) 공지들만 정렬해서 이전/다음 계산
      const activeSorted = normalized
        .filter((n) => n.isActive)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      const currentIndex = activeSorted.findIndex((n) => n.id === id)

      if (currentIndex !== -1) {
        setPrevNotice(
          currentIndex > 0 ? activeSorted[currentIndex - 1] : null,
        )
        setNextNotice(
          currentIndex < activeSorted.length - 1
            ? activeSorted[currentIndex + 1]
            : null,
        )
      } else {
        // 비공개 글 등으로 리스트에 없는 경우
        setPrevNotice(null)
        setNextNotice(null)
      }

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
      {/* 상단: 제목 + 메타 + (관리자 전용) 액션 */}
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

        {/* 수정 / 삭제는 관리자만 노출 */}
        {isAdmin && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
          </div>
        )}
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
        <>
          {/* 본문 */}
          <article className="notice-body prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 dark:prose-invert dark:text-slate-200">
            <div dangerouslySetInnerHTML={{ __html: notice.body }} />
          </article>

          {/* ✅ 이전글 / 다음글 네비게이션 */}
          <section className="mt-10 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <dl className="space-y-2">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-slate-400">
                  이전 글
                </dt>
                <dd className="flex-1">
                  {prevNotice ? (
                    <Link
                      to={`/notices/${encodeURIComponent(prevNotice.id)}`}
                      className="line-clamp-1 text-slate-700 hover:text-teal-600 dark:text-slate-200 dark:hover:text-teal-400"
                    >
                      {prevNotice.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">
                      이전 글이 없습니다.
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-slate-400">
                  다음 글
                </dt>
                <dd className="flex-1">
                  {nextNotice ? (
                    <Link
                      to={`/notices/${encodeURIComponent(nextNotice.id)}`}
                      className="line-clamp-1 text-slate-700 hover:text-teal-600 dark:text-slate-200 dark:hover:text-teal-400"
                    >
                      {nextNotice.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">
                      다음 글이 없습니다.
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* 하단: 목록 버튼 */}
          <div className="mt-6 flex justify-end">
            <Link to="/notices" className="btn btn-outline btn-sm">
              목록으로 돌아가기
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
