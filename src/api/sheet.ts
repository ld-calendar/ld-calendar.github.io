// src/api/sheet.ts
import { buildSheetUrl } from './config'
import type {
  ApiResult,
  Commission,
  Notice,
  RawCommissionRow,
  RawNoticeRow,
  CommissionStatus,
  PriceTier,
  NewCommissionPayload,
  NewNoticePayload,
} from '../types'
import { calcPrice } from '../utils/price'
import { getWeekStartString } from '../utils/calendar'
import { getIdTokenOrThrow } from './authToken'

/* ------------------------------
 * 공통 fetchJson (GET 전용)
 * ------------------------------ */
async function fetchJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

function toNumber(value: any, fallback = 0): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

function toBoolean(value: any, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim()
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return fallback
}

/** 날짜를 항상 'YYYY-MM-DD' 문자열로 정규화 */
function normalizeDate(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') {
    // "2025-12-10T00:00:00Z" 같은 것도 앞 10자리만 사용
    return value.slice(0, 10)
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/* ------------------------------
 * 인메모리 캐시
 * ------------------------------ */

const CACHE_TTL = 3 * 60 * 1000 // 3분

let commissionsCache: Commission[] | null = null
let commissionsFetchedAt = 0

let noticesCache: Notice[] | null = null
let noticesFetchedAt = 0

function isCacheValid(fetchedAt: number): boolean {
  if (!fetchedAt) return false
  return Date.now() - fetchedAt < CACHE_TTL
}

function clearCommissionCache() {
  commissionsCache = null
  commissionsFetchedAt = 0
}

function clearNoticeCache() {
  noticesCache = null
  noticesFetchedAt = 0
}

/* ------------------------------
 * Raw → Domain 매핑
 * ------------------------------ */

/** RawCommissionRow → Commission */
function mapCommissionRow(
  row: RawCommissionRow,
  index: number,
): Commission | null {
  const materialDate = normalizeDate(row.materialReceivedDate)
  const reviewDate = normalizeDate(row.reviewDate)

  // 필수 값 없으면 스킵
  if (!row.clientName || !reviewDate) return null

  const id = row.id || `row-${index}`
  const basePrice = toNumber(row.basePrice, 50000)

  const auto =
    materialDate && reviewDate
      ? calcPrice(materialDate, reviewDate, basePrice)
      : null

  const diffDaysValue =
    row.diffDays !== undefined
      ? toNumber(row.diffDays, auto?.diffDays ?? 0)
      : auto?.diffDays ?? ('' as any)

  const priceTierValue =
    (row.priceTier as PriceTier | undefined) ??
    (auto ? auto.priceTier : 'PENDING')

  const finalPriceValue =
    row.finalPrice !== undefined
      ? toNumber(row.finalPrice, auto?.finalPrice ?? basePrice)
      : auto?.finalPrice ?? basePrice

  const extraPriceValue =
    row.extraPrice !== undefined
      ? toNumber(row.extraPrice, auto?.extraPrice ?? 0)
      : auto?.extraPrice ?? 0

  // weekStart는 시트 값 무시하고 reviewDate 기준 재계산
  const weekStart = getWeekStartString(reviewDate)

  const slotIndex = toNumber(row.slotIndex, 0)
  const statusValue =
    (row.status as CommissionStatus | undefined) ?? 'PAID'

  return {
    id,
    clientName: row.clientName,
    depositorName: row.depositorName ?? '',
    status: statusValue,
    materialReceivedDate: materialDate,
    reviewDate,
    weekStart,
    slotIndex,
    basePrice,
    priceTier: priceTierValue,
    finalPrice: finalPriceValue,
    diffDays: diffDaysValue as any,
    extraPrice: extraPriceValue,
    memo: row.memo,
    createdAt: row.createdAt,
  }
}

/** RawNoticeRow → Notice */
function mapNoticeRow(
  row: RawNoticeRow,
  index: number,
): Notice | null {
  if (!row.title || !row.body) return null
  const id = row.id || `notice-${index}`

  return {
    id,
    title: row.title,
    body: row.body,
    isPinned: toBoolean(row.isPinned, false),
    isActive: toBoolean(row.isActive, true),
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt,
  }
}

/* ------------------------------
 * 조회 API (+ 캐시)
 * ------------------------------ */

export async function fetchCommissions(): Promise<ApiResult<Commission[]>> {
  if (commissionsCache && isCacheValid(commissionsFetchedAt)) {
    return { ok: true, data: commissionsCache }
  }

  const url = buildSheetUrl('commission')
  const res = await fetchJson<RawCommissionRow[]>(url)
  if (!res.ok) return res

  const list = res.data
    .map(mapCommissionRow)
    .filter((c): c is Commission => c !== null)

  commissionsCache = list
  commissionsFetchedAt = Date.now()

  return { ok: true, data: list }
}

export async function fetchNotices(): Promise<ApiResult<Notice[]>> {
  if (noticesCache && isCacheValid(noticesFetchedAt)) {
    return { ok: true, data: noticesCache }
  }

  const url = buildSheetUrl('notices')
  const res = await fetchJson<RawNoticeRow[]>(url)
  if (!res.ok) return res

  const list = res.data
    .map(mapNoticeRow)
    .filter((n): n is Notice => n !== null)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

  noticesCache = list
  noticesFetchedAt = Date.now()

  return { ok: true, data: list }
}

/* ------------------------------
 * URL 인코딩 헬퍼
 * ------------------------------ */

function toFormData(obj: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue
    params.append(key, String(value))
  }
  return params
}

/* ------------------------------
 * 에러 메세지 머지 헬퍼
 * ------------------------------ */

function mergeError(data: {
  error?: string
  message?: string
}): string {
  if (data.error && data.message) {
    return `${data.error}: ${data.message}`
  }
  return data.error || data.message || 'Unknown error'
}

/* ------------------------------
 * 생성 API
 * ------------------------------ */

export async function createCommission(
  payload: NewCommissionPayload,
): Promise<ApiResult<{ id: string }>> {
  const url = buildSheetUrl('commission')
  try {
    const idToken = await getIdTokenOrThrow()

    const body = toFormData({
      mode: 'create',
      idToken,
      ...payload,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

    const data = (await res.json()) as {
      ok?: boolean
      id?: string
      error?: string
      message?: string
    }

    if (data.ok && data.id) {
      clearCommissionCache()
      return { ok: true, data: { id: data.id } }
    }

    return { ok: false, error: mergeError(data) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' }
  }
}

export async function createNotice(
  payload: NewNoticePayload,
): Promise<ApiResult<{ id: string }>> {
  const url = buildSheetUrl('notices')
  try {
    const idToken = await getIdTokenOrThrow()

    const body = toFormData({
      mode: 'create',
      idToken,
      ...payload,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

    const data = (await res.json()) as {
      ok?: boolean
      id?: string
      error?: string
      message?: string
    }

    if (data.ok && data.id) {
      clearNoticeCache()
      return { ok: true, data: { id: data.id } }
    }

    return { ok: false, error: mergeError(data) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' }
  }
}

/* ------------------------------
 * 수정 API
 * ------------------------------ */

export async function updateCommission(
  id: string,
  payload: Partial<NewCommissionPayload>,
): Promise<ApiResult<{ id: string }>> {
  const url = buildSheetUrl('commission')
  try {
    const idToken = await getIdTokenOrThrow()

    const body = toFormData({
      mode: 'update',
      id,
      idToken,
      ...payload,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

    const data = (await res.json()) as {
      ok?: boolean
      id?: string
      error?: string
      message?: string
    }

    if (data.ok && data.id) {
      clearCommissionCache()
      return { ok: true, data: { id: data.id } }
    }

    return { ok: false, error: mergeError(data) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' }
  }
}

export async function updateNotice(
  id: string,
  payload: Partial<NewNoticePayload>,
): Promise<ApiResult<{ id: string }>> {
  const url = buildSheetUrl('notices')
  try {
    const idToken = await getIdTokenOrThrow()

    const body = toFormData({
      mode: 'update',
      id,
      idToken,
      ...payload,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

    const data = (await res.json()) as {
      ok?: boolean
      id?: string
      error?: string
      message?: string
    }

    if (data.ok && data.id) {
      clearNoticeCache()
      return { ok: true, data: { id: data.id } }
    }

    return { ok: false, error: mergeError(data) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' }
  }
}

/* ------------------------------
 * 삭제 API
 * ------------------------------ */

export async function deleteNotice(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  const url = buildSheetUrl('notices')
  try {
    const idToken = await getIdTokenOrThrow()

    const body = toFormData({
      mode: 'delete',
      id,
      idToken,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

    const data = (await res.json()) as {
      ok?: boolean
      id?: string
      error?: string
      message?: string
    }

    if (data.ok && data.id) {
      clearNoticeCache()
      return { ok: true, data: { id: data.id } }
    }

    return { ok: false, error: mergeError(data) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' }
  }
}
