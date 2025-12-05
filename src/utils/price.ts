// src/utils/price.ts
import type { PriceTier } from '../types'

export function diffDays(from: string, to: string): number {
  if (!from || !to) return NaN
  const a = new Date(from)
  const b = new Date(to)
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function getPriceTier(diff: number): PriceTier {
  if (!Number.isFinite(diff)) return 'NORMAL'
  if (diff <= 3) return 'RUSH'
  if (diff <= 10) return 'FAST'
  return 'NORMAL'
}

export function calcPriceFromTier(
  tier: PriceTier,
  basePrice = 50000,
): { finalPrice: number; extraPrice: number } {
  switch (tier) {
    case 'RUSH':
      return { finalPrice: basePrice + 50000, extraPrice: 50000 }
    case 'FAST':
      return { finalPrice: basePrice + 20000, extraPrice: 20000 }
    case 'NORMAL':
    case 'PENDING':
    default:
      return { finalPrice: basePrice, extraPrice: 0 }
  }
}

export function calcPrice(
  materialReceivedDate: string,
  reviewDate: string,
  basePrice = 50000,
) {
  const d = diffDays(materialReceivedDate, reviewDate)
  const tier = getPriceTier(d)
  const { finalPrice, extraPrice } = calcPriceFromTier(tier, basePrice)
  return { diffDays: d, priceTier: tier, finalPrice, extraPrice }
}
