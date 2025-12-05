// src/types.ts

/** 공통 타입 */
export type IsoDateString = string        // 'YYYY-MM-DD'
export type IsoDateTimeString = string    // 'YYYY-MM-DDTHH:mm:ss' 등

/** 커미션 관련 */

export type CommissionStatus = 'PAID' | 'REVIEW_REQUESTED' | 'DONE'
export type PriceTier = 'NORMAL' | 'FAST' | 'RUSH' | 'PENDING'

export interface Commission {
  id: string
  clientName: string
  depositorName: string
  status: CommissionStatus

  materialReceivedDate: IsoDateString | '' // 자료 없을 수 있음
  reviewDate: IsoDateString

  weekStart: IsoDateString
  slotIndex: number

  basePrice: number
  priceTier: PriceTier
  finalPrice: number

  diffDays?: number | ''       // 시트에서 공백일 수도
  extraPrice?: number

  memo?: string
  createdAt?: IsoDateTimeString | string
}

/** 구글 시트 commission Raw row 타입 */
export interface RawCommissionRow {
  id?: string
  clientName?: string
  depositorName?: string
  status?: string

  materialReceivedDate?: string
  reviewDate?: string

  diffDays?: string | number
  priceTier?: string
  basePrice?: string | number
  extraPrice?: string | number
  finalPrice?: string | number

  weekStart?: string
  slotIndex?: string | number

  memo?: string
  createdAt?: string
}

/** 공지사항 */

export interface Notice {
  id: string
  title: string
  body: string

  isPinned: boolean
  isActive: boolean

  createdAt: IsoDateString | string
  updatedAt?: IsoDateString | string
}

/** 구글 시트 notices Raw row 타입 */
export interface RawNoticeRow {
  id?: string
  title?: string
  body?: string
  isPinned?: boolean | string
  isActive?: boolean | string
  createdAt?: string
  updatedAt?: string
}

/** 캘린더/요약용 */

export interface WeekSummary {
  weekStart: IsoDateString
  capacity: number
  booked: number
  remaining: number
  isClosed: boolean
}

export interface CalendarDay {
  date: IsoDateString
  inCurrentMonth: boolean
  weekStart: IsoDateString
}

/** API 결과 공통 타입 */

export type SheetName = 'commission' | 'notices'

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiFailure {
  ok: false
  error: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

/** 등록용 payload 타입 */

export interface NewCommissionPayload {
  clientName: string
  depositorName: string
  status: CommissionStatus
  reviewDate: IsoDateString                 // 필수
  materialReceivedDate?: IsoDateString      // 선택
  memo?: string
}

export interface NewNoticePayload {
  title: string
  body: string
  isPinned: boolean
  isActive: boolean
}
