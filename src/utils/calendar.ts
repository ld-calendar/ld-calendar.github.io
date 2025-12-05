// src/utils/calendar.ts
import type { Commission, WeekSummary } from '../types'

export type CalendarDay = {
  date: string        // 'YYYY-MM-DD'
  inCurrentMonth: boolean
  weekStart: string   // 이 날짜가 속한 주의 "일요일" 날짜 (YYYY-MM-DD)
}

const DEFAULT_WEEK_CAPACITY = 5

/**
 * 로컬 타임존 기준 YYYY-MM-DD 문자열
 */
export function toDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 'YYYY-MM-DD' 문자열을 로컬 Date로
 */
function fromDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * 주 시작(일요일 기준) Date
 */
function getWeekStartSundayDate(base: Date): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun, ... 6 = Sat
  d.setDate(d.getDate() - day) // 해당 주의 일요일로 이동
  return d
}

/**
 * (외부에서 쓰는) 주 시작 문자열 헬퍼
 * - 기존 코드에서 import { getWeekStartString } 쓰던 부분 호환용
 */
export function getWeekStartString(dateStr: string): string {
  const base = fromDateKey(dateStr)
  return toDateKey(getWeekStartSundayDate(base))
}

/**
 * 캘린더용 날짜 배열 생성
 * - 주 시작: 일요일
 * - 헤더: 일 월 화 수 목 금 토 순서에 맞는 그리드
 */
export function buildCalendarDays(baseDate: Date): CalendarDay[] {
  const year = baseDate.getFullYear()
  const monthIndex = baseDate.getMonth() // 0~11

  // 이번 달 1일
  const firstOfMonth = new Date(year, monthIndex, 1)
  // 이번 달 1일이 포함된 주의 일요일
  const gridStart = getWeekStartSundayDate(firstOfMonth)

  // 이번 달 말일
  const lastOfMonth = new Date(year, monthIndex + 1, 0)
  // 말일이 포함된 주의 일요일
  const lastWeekStart = getWeekStartSundayDate(lastOfMonth)
  // 그 주의 토요일까지
  const gridEnd = new Date(lastWeekStart)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const days: CalendarDay[] = []
  const cur = new Date(gridStart)

  while (cur <= gridEnd) {
    const dateStr = toDateKey(cur)
    const weekStart = getWeekStartString(dateStr)

    days.push({
      date: dateStr,
      inCurrentMonth: cur.getMonth() === monthIndex,
      weekStart,
    })

    cur.setDate(cur.getDate() + 1)
  }

  return days
}

/**
 * 주간 요약: 주 시작(일요일 기준)별로 booked 집계
 */
export function buildWeekSummaries(
  commissions: Commission[],
): Record<string, WeekSummary> {
  const map: Record<string, WeekSummary> = {}

  for (const c of commissions) {
    if (!c.reviewDate) continue
    const weekStart = getWeekStartString(c.reviewDate)

    if (!map[weekStart]) {
      map[weekStart] = {
        weekStart,
        capacity: DEFAULT_WEEK_CAPACITY,
        booked: 0,
        remaining: DEFAULT_WEEK_CAPACITY,
        isClosed: false,
      }
    }
    map[weekStart].booked += 1
  }

  Object.values(map).forEach((ws) => {
    ws.remaining = Math.max(0, ws.capacity - ws.booked)
    ws.isClosed = ws.remaining === 0
  })

  return map
}

/**
 * 하루 기준 검수 건수
 */
export function getDailyReviewCount(
  commissions: Commission[],
  dateStr: string,
): number {
  return commissions.filter((c) => c.reviewDate === dateStr).length
}

/**
 * 이번 주 / 다음 주 시작일 (일요일 기준)
 * - AdminDashboard 에서 사용
 */
export function getThisWeekAndNextWeekStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisWeekStartDate = getWeekStartSundayDate(today)
  const nextWeekStartDate = new Date(thisWeekStartDate)
  nextWeekStartDate.setDate(thisWeekStartDate.getDate() + 7)

  return {
    thisWeekStart: toDateKey(thisWeekStartDate),
    nextWeekStart: toDateKey(nextWeekStartDate),
  }
}
