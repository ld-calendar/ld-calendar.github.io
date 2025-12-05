// src/pages/AdminDashboardPage.tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCommissions } from '../api/sheet'
import type { Commission, WeekSummary } from '../types'
import {
  buildWeekSummaries,
  getThisWeekAndNextWeekStart,
} from '../utils/calendar'

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const res = await fetchCommissions()
      if (!res.ok) {
        setError(res.error)
        setLoading(false)
        return
      }
      setCommissions(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const weekSummariesMap = buildWeekSummaries(commissions)
  const { thisWeekStart, nextWeekStart } = getThisWeekAndNextWeekStart()

  const DEFAULT_CAPACITY = 5

  const getWeekSummaryOrEmpty = (weekStart: string): WeekSummary => {
    const found = weekSummariesMap[weekStart]
    if (found) return found
    return {
      weekStart,
      capacity: DEFAULT_CAPACITY,
      booked: 0,
      remaining: DEFAULT_CAPACITY,
      isClosed: false,
    }
  }

  const thisWeek = getWeekSummaryOrEmpty(thisWeekStart)
  const nextWeek = getWeekSummaryOrEmpty(nextWeekStart)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const todayCommissions = commissions.filter(
    (c) => c.reviewDate === todayStr,
  )

  const sortedAll = [...commissions].sort((a, b) =>
    a.reviewDate.localeCompare(b.reviewDate),
  )
  const totalPages = Math.max(1, Math.ceil(sortedAll.length / pageSize))

  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const startIndex = (currentPage - 1) * pageSize
  const pageItems = sortedAll.slice(startIndex, startIndex + pageSize)

  const handleEdit = (id: string) => {
    navigate(`/admin/new?id=${encodeURIComponent(id)}`)
  }

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }

  // D-day 계산 (라벨 + 남은 일수)
  const getDDayInfo = (
    dateStr: string,
  ): { label: string; daysDiff: number } | null => {
    if (!dateStr) return null
    const target = new Date(dateStr)
    if (Number.isNaN(target.getTime())) return null
    target.setHours(0, 0, 0, 0)

    const diff =
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    const days = Math.round(diff)

    let label = ''
    if (days === 0) label = 'D-day'
    else if (days > 0) label = `D-${days}`
    else label = `D+${Math.abs(days)}`

    return { label, daysDiff: days }
  }

  return (
    <div className="page-shell">
      {/* 헤더 */}
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">일정 및 예약 현황 관리</p>
      </header>

      {loading && <div className="py-20 text-center">Loading...</div>}
      {error && (
        <div className="py-20 text-center text-red-500">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* 상단 액션 버튼 */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link
              to="/admin/new"
              className="btn bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              + 새 커미션
            </Link>
            <Link
              to="/admin/notices/new"
              className="btn btn-outline px-4 py-2 text-sm"
            >
              + 공지사항
            </Link>
          </div>

          {/* 현황 카드 */}
          <section className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 이번 주 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                THIS WEEK
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {thisWeek.booked}
                </span>
                <span className="text-sm text-slate-400">
                  / {thisWeek.capacity} booked
                </span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-teal-500 transition-all"
                  style={{
                    width: `${(thisWeek.booked / thisWeek.capacity) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400">
                {thisWeek.remaining} slots remaining
              </p>
            </div>

            {/* 다음 주 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                NEXT WEEK
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {nextWeek.booked}
                </span>
                <span className="text-sm text-slate-400">
                  / {nextWeek.capacity} booked
                </span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${(nextWeek.booked / nextWeek.capacity) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                {nextWeek.remaining} slots remaining
              </p>
            </div>

            {/* 오늘 일정 */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 lg:col-span-1">
              <h2 className="mb-3 text-sm font-semibold text-teal-800 dark:text-teal-200">
                TODAY&apos;S REVIEW
              </h2>
              {todayCommissions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  오늘 예정된 검수가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {todayCommissions.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-700"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {c.clientName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {c.finalPrice.toLocaleString()}원 · {c.status}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEdit(c.id)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 전체 커미션 목록 (신청목록 + D-day) */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">
              전체 커미션 목록
            </h2>

            {pageItems.length === 0 ? (
              <div className="list-empty">
                등록된 커미션이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {pageItems.map((c) => {
                  const ddayInfo = getDDayInfo(c.reviewDate)
                  const ddayLabel = ddayInfo?.label ?? ''
                  // D-day가 0일(D-day) ~ 3일(D-3) 사이면 강조
                  const isSoon =
                    ddayInfo &&
                    ddayInfo.daysDiff >= 0 &&
                    ddayInfo.daysDiff <= 3

                  // ✅ 최종 완료된 항목 여부 (영어/한글 둘 다 대응)
                  const isDone =
                    c.status === 'DONE' || c.status === '완료'

                  return (
                    <article
                      key={c.id}
                      className={`list-card transition-all ${
                        isSoon
                          ? 'border-amber-300 bg-amber-50/70 shadow-md ring-1 ring-amber-200 dark:border-amber-400/70 dark:bg-amber-950/30 dark:ring-amber-500/40'
                          : ''
                      } ${
                        isDone
                          ? 'opacity-60 hover:opacity-90'
                          : ''
                      }`}
                    >
                      {/* 이 카드는 전체 클릭이 아니라 수정 버튼만 동작하게, div 사용 */}
                      <div className="list-card-link cursor-default">
                        <div className="list-left">
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              검수일 {c.reviewDate}
                            </span>

                            {ddayLabel && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  isSoon
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                                }`}
                              >
                                {ddayLabel}
                              </span>
                            )}

                            {c.materialReceivedDate && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                · 자료일 {c.materialReceivedDate}
                              </span>
                            )}

                            {isDone && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                완료
                              </span>
                            )}
                          </div>

                          <p
                            className={`list-title-strong ${
                              isDone ? 'line-through' : ''
                            }`}
                          >
                            {c.clientName}
                          </p>
                          <p className="list-note">
                            입금자: {c.depositorName || '-'}
                          </p>
                        </div>

                        <div className="list-right">
                          <span className="badge-status">{c.status}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {c.finalPrice.toLocaleString()}원
                          </span>
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
                          >
                            수정
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* 페이지네이션 공통 디자인 */}
            <div className="pagination-bar">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  이전
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  다음
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
