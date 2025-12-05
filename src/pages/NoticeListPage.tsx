// src/pages/NoticeListPage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNotices } from '../api/sheet'
import type { Notice } from '../types'
import { normalizeNotices } from '../utils/notice'

export function NoticeListPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const res = await fetchNotices()
      if (!res.ok) {
        setError(`공지 데이터를 불러오지 못했습니다: ${res.error}`)
        setLoading(false)
        return
      }

      const normalized = normalizeNotices(res.data)
      setNotices(normalized)
      setLoading(false)
    }
    load()
  }, [])

  const pinned = notices
    .filter((n) => n.isPinned && n.isActive)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const normal = notices
    .filter((n) => !n.isPinned && n.isActive)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Notice Board</h1>
        <p className="page-subtitle">
          커미션 진행 관련 안내 및 중요 소식
        </p>
      </header>

      {loading && (
        <div className="py-20 text-center text-slate-500">
          공지사항을 불러오고 있습니다...
        </div>
      )}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 space-y-8">
          {/* 중요 공지 */}
          {pinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400">
                중요 공지
              </div>

              <div className="space-y-3">
                {pinned.map((notice) => (
                  <article key={notice.id} className="list-card">
                    <Link
                      to={`/notices/${encodeURIComponent(notice.id)}`}
                      className="list-card-link"
                    >
                      <div className="list-left">
                        <div className="list-date">
                          {notice.createdAt.slice(0, 10)}
                        </div>
                        <p className="list-title-strong">{notice.title}</p>
                      </div>

                      <div className="list-right">
                        <span className="badge-pin-dot" />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 일반 공지 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">
              전체 공지
            </h2>

            {normal.length === 0 ? (
              <div className="list-empty">
                등록된 공지가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {normal.map((notice) => (
                  <article key={notice.id} className="list-card">
                    <Link
                      to={`/notices/${encodeURIComponent(notice.id)}`}
                      className="list-card-link"
                    >
                      <div className="list-left">
                        <div className="list-date">
                          {notice.createdAt.slice(0, 10)}
                        </div>
                        <p className="list-title">{notice.title}</p>
                      </div>

                      <div className="list-right" />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
