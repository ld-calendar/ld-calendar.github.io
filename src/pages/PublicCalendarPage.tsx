// src/pages/PublicCalendarPage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCommissions, fetchNotices } from '../api/sheet'
import type { Commission, Notice, WeekSummary } from '../types'
import {
  buildCalendarDays,
  buildWeekSummaries,
  getDailyReviewCount,
  toDateKey,
} from '../utils/calendar'
import { normalizeNotices } from '../utils/notice'

export function PublicCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [baseDate, setBaseDate] = useState(() => new Date())

  // 오늘 기준 값 (연/월 제한용) – 로컬 기준
  const today = new Date()
  const TODAY_YEAR = today.getFullYear()
  const TODAY_MONTH_INDEX = today.getMonth() // 0~11

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const [cRes, nRes] = await Promise.all([
        fetchCommissions(),
        fetchNotices(),
      ])
      if (!cRes.ok) {
        setError(`커미션 데이터를 불러오지 못했습니다: ${cRes.error}`)
        setLoading(false)
        return
      }
      if (!nRes.ok) {
        setError(`공지 데이터를 불러오지 못했습니다: ${nRes.error}`)
        setLoading(false)
        return
      }

      setCommissions(cRes.data)

      // 공지 isPinned / isActive 정규화
      const normalizedNotices = normalizeNotices(nRes.data)
      setNotices(normalizedNotices)

      setLoading(false)
    }
    load()
  }, [])

  const clampToMinMonth = (d: Date) => {
    const min = new Date(TODAY_YEAR, TODAY_MONTH_INDEX, 1)
    return d < min ? min : d
  }

  const days = buildCalendarDays(baseDate)
  const weekSummaries = buildWeekSummaries(commissions)

  const year = baseDate.getFullYear()
  const month = baseDate.getMonth() + 1

  // 연/월 select 옵션 (올해 ~ 3년 뒤까지)
  const yearOptions = Array.from({ length: 3 }, (_, i) => TODAY_YEAR + i)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => {
      if (year === TODAY_YEAR) {
        // 올해인 경우, 오늘 기준 이전 달은 숨김
        return m - 1 >= TODAY_MONTH_INDEX
      }
      return true
    },
  )

  const isAtMinMonth =
    year === TODAY_YEAR && month - 1 === TODAY_MONTH_INDEX

  const handlePrevMonth = () => {
    setBaseDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return clampToMinMonth(d)
    })
  }

  const handleNextMonth = () => {
    setBaseDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(e.target.value)
    setBaseDate((prev) => {
      const d = new Date(prev)
      d.setFullYear(newYear)
      return clampToMinMonth(d)
    })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(e.target.value) - 1
    setBaseDate((prev) => {
      const d = new Date(prev)
      d.setMonth(newMonth)
      return clampToMinMonth(d)
    })
  }

  // 현재 달에 포함되는 day들 기준으로 주 리스트 만들기
  const monthDays = days.filter((d) => d.inCurrentMonth)
  const monthWeekStarts = Array.from(
    new Set(monthDays.map((d) => d.weekStart)),
  ).sort()
  const weekLabels = ['1주차', '2주차', '3주차', '4주차', '5주차']

  const DEFAULT_CAPACITY = 5
  const getWeekSummaryOrEmpty = (weekStart: string): WeekSummary => {
    const found = weekSummaries[weekStart]
    if (found) return found
    return {
      weekStart,
      capacity: DEFAULT_CAPACITY,
      booked: 0,
      remaining: DEFAULT_CAPACITY,
      isClosed: false,
    }
  }

  const monthWeekInfos = monthWeekStarts.map((ws, idx) => ({
    label: weekLabels[idx] ?? `${idx + 1}주차`,
    summary: getWeekSummaryOrEmpty(ws),
  }))

  // 오늘 날짜 (로컬) – 요일 계산/하이라이트용
  const todayStr = toDateKey(new Date())

  // 공지 하이라이트 (중요 공지 우선, 최대 2개까지)
  const pinned = notices
    .filter((n) => n.isPinned && n.isActive)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const normal = notices
    .filter((n) => !n.isPinned && n.isActive)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const highlight: Notice[] = []
  for (const n of pinned) {
    if (highlight.length >= 2) break
    highlight.push(n)
  }
  for (const n of normal) {
    if (highlight.length >= 2) break
    highlight.push(n)
  }

  return (
    <div className="page-shell">
      {/* 헤더 */}
      <header className="page-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="page-title">
              Commission <span className="text-teal-500">Calendar</span>
            </h1>
            <p className="page-subtitle">
              커미션 일정과 잔여 슬롯, 진행에 필요한 안내를 이곳에서 확인할 수
              있어요.
            </p>
          </div>

          <div className="md:flex-shrink-0">
            <a
              href="https://open.kakao.com/o/skxgV2Th"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              카카오 오픈채팅으로 신청하기
            </a>
          </div>
        </div>
      </header>

      {/* 공지 하이라이트 (리스트 카드 통일) */}
      <section className="mt-8 space-y-3">
        <div className="mb-1 flex items-end justify-between">
          <h2 className="section-title">공지사항</h2>
          <Link
            to="/notices"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            전체보기 &rarr;
          </Link>
        </div>

        {/* 로딩 스켈레톤 */}
        {loading && !error && (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((i) => (
              <article key={i} className="list-card animate-pulse">
                <div className="list-card-link">
                  <div className="list-left">
                    <div className="mb-2 h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="list-right">
                    <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="list-empty text-red-500">
            공지 데이터를 불러오지 못했습니다.
          </div>
        )}

        {/* 실제 공지 카드 – 중요/일반 상관없이 최대 2개 */}
        {!loading && !error && (
          <>
            {highlight.length === 0 ? (
              <div className="list-empty">등록된 공지가 없습니다.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {highlight.map((notice) => (
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

                      {notice.isPinned && (
                        <div className="list-right">
                          <span className="badge-pin-dot" />
                        </div>
                      )}
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 프로세스 & 가격 */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 section-title">진행 과정</h2>

          <p className="mb-3 text-sm text-rose-500 dark:text-rose-400">
            오픈채팅으로 금액, 작동 방식 등 홈페이지에 기재된 내용에 대한
            질문에는 별도 답변을 드리지 않습니다. 문의 전 이 페이지의 공지사항을
            먼저 확인해주세요.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: '오픈채팅 신청',
                desc: '행사날짜/멤버이름으로 입장 후 희망 검수일 전달',
              },
              {
                step: '02',
                title: '일정 확정 및 입금',
                desc: '검수일 조율 후 최종 금액 확정 및 입금 진행',
              },
              {
                step: '03',
                title: '자료 전달 및 검수',
                desc: '자료 확인 후 시안 전달 (수정 1회 가능)',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-slate-100 p-5 dark:bg-slate-800/50"
              >
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  STEP {item.step}
                </span>
                <h3 className="mt-2 font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 section-title">가격 안내</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  기본가
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  50,000원
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  10일 이내 (빠른마감)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  70,000원
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  3일 이내 (초급행)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  100,000원
                </span>
              </li>
            </ul>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
              * 자료 받은 날짜 기준으로 산정됩니다.
            </div>
          </div>
        </section>
      </div>

      {/* 캘린더 메인 */}
      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title">잔여 슬롯 안내</h2>

          {/* 모바일에서는 제목 아래로 내려오도록, sm부터 오른쪽 정렬 */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm sm:px-4 dark:bg-slate-800">
            <button
              onClick={handlePrevMonth}
              disabled={isAtMinMonth}
              className="text-slate-500 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:text-teal-400"
            >
              &larr;
            </button>
            <div className="flex items-center gap-2">
              <select
                value={year}
                onChange={handleYearChange}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={handleMonthChange}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}월
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              className="text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
            >
              &rarr;
            </button>
          </div>
        </div>


        <div className="min-h-[300px] rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-[70px] rounded-2xl bg-slate-200" />
              <div className="h-64 rounded-3xl bg-slate-200" />
            </div>
          )}
          {error && !loading && (
            <div className="py-20 text-center text-red-500">{error}</div>
          )}
          {!loading && !error && (
            <>
              {/* 주간 요약 (일요일 시작 주 기준) */}
              <div className="mb-4 -mx-2 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible">
                <div className="flex gap-3 px-2 sm:grid sm:grid-cols-3 md:grid-cols-5 sm:px-0">
                  {monthWeekInfos.map(({ label, summary }) => (
                    <div
                      key={summary.weekStart}
                      className={`flex min-w-[130px] flex-col items-center justify-center rounded-xl border p-3 text-center text-xs sm:min-w-0 sm:text-sm transition-colors ${
                        summary.remaining === 0
                          ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                          : 'border-teal-200 bg-teal-50 dark:border-teal-900/30 dark:bg-teal-900/10'
                      }`}
                    >
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {label}
                      </span>
                      <span
                        className={`mt-1 font-bold ${
                          summary.remaining === 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-teal-600 dark:text-teal-400'
                        }`}
                      >
                        {summary.remaining} 슬롯 남음
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 캘린더 (일 ~ 토) */}
              <div className="-mx-2 overflow-x-auto sm:mx-0">
                <div className="min-w-[560px] space-y-2 px-1 sm:min-w-0 sm:px-0">
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 sm:text-xs">
                    <div>SUN</div>
                    <div>MON</div>
                    <div>TUE</div>
                    <div>WED</div>
                    <div>THU</div>
                    <div>FRI</div>
                    <div>SAT</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {days.map((day) => {
                      const dailyCount = getDailyReviewCount(
                        commissions,
                        day.date,
                      )
                      const summaryForWeek =
                        getWeekSummaryOrEmpty(day.weekStart)
                      const isWeekStart = day.date === day.weekStart
                      const isToday = day.date === todayStr

                      return (
                        <div
                          key={day.date}
                          className={[
                            'relative flex min-h-[64px] flex-col rounded-lg border p-1.5 text-[11px] sm:min-h-[80px] sm:rounded-xl sm:p-2 sm:text-sm transition-all',
                            isToday
                              ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-slate-800'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/50',
                            !day.inCurrentMonth && 'opacity-30 grayscale',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className="flex justify-between">
                            <span
                              className={
                                isToday
                                  ? 'font-semibold text-teal-600 dark:text-teal-400'
                                  : 'font-medium text-slate-600 dark:text-slate-400'
                              }
                            >
                              {Number(day.date.slice(-2))}
                            </span>
                          </div>

                          {isWeekStart && (
                            <div className="mt-1">
                              <span
                                className={`inline-block rounded-md px-1 py-0.5 text-[9px] font-bold sm:text-[10px] ${
                                  summaryForWeek.isClosed
                                    ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                                }`}
                              >
                                {summaryForWeek.isClosed
                                  ? '마감'
                                  : `잔여 ${summaryForWeek.remaining}`}
                              </span>
                            </div>
                          )}

                          <div className="mt-auto flex justify-end gap-1">
                            {Array.from({
                              length: Math.min(dailyCount, 5),
                            }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-3 w-3 rounded-full bg-teal-500"
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
