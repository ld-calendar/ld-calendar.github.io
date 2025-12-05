// src/utils/notice.ts
import type { Notice } from '../types'

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === '1' || v === 'y' || v === 'yes') return true
    if (v === 'false' || v === '0' || v === 'n' || v === 'no') return false
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return false
}

export function normalizeNotice(raw: any): Notice {
  return {
    ...raw,
    isPinned: toBool(raw.isPinned),
    isActive: toBool(raw.isActive),
  }
}

export function normalizeNotices(list: any[]): Notice[] {
  return list.map(normalizeNotice)
}
