// src/api/config.ts
import type { SheetName } from '../types'

// TODO: 여기에 실제 Apps Script 웹앱 URL 넣기
const APPS_SCRIPT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbwpaO_AGrRy8WOKR-XhhAUsaI4X5qPwGHPRZLIDjJn8HGDt6P7E0xyu-fCo9AJYdI_7/exec'

export function buildSheetUrl(sheet: SheetName): string {
  const url = new URL(APPS_SCRIPT_BASE_URL)
  url.searchParams.set('sheet', sheet)
  return url.toString()
}
