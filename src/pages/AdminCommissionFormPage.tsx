// src/pages/AdminCommissionFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { CommissionStatus } from '../types'
import { calcPrice } from '../utils/price'
import {
  createCommission,
  updateCommission,
  fetchCommissions,
} from '../api/sheet'

export function AdminCommissionFormPage() {
  const [clientName, setClientName] = useState('')
  const [depositorName, setDepositorName] = useState('')
  const [status, setStatus] = useState<CommissionStatus>('PAID')
  const [materialDate, setMaterialDate] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [memo, setMemo] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const isEdit = !!editId

  useEffect(() => {
    if (!isEdit) return

    async function loadExisting() {
      setLoadingExisting(true)
      setError(null)
      const res = await fetchCommissions()
      if (!res.ok) {
        setError(`기존 데이터를 불러오지 못했습니다: ${res.error}`)
        setLoadingExisting(false)
        return
      }
      const target = res.data.find((c) => c.id === editId)
      if (!target) {
        setError('해당 커미션을 찾을 수 없습니다.')
        setLoadingExisting(false)
        return
      }

      setClientName(target.clientName)
      setDepositorName(target.depositorName || '')
      setStatus(target.status)
      setMaterialDate(target.materialReceivedDate || '')
      setReviewDate(target.reviewDate)
      setMemo(target.memo || '')
      setLoadingExisting(false)
    }

    loadExisting()
  }, [isEdit, editId])

  const hasBothDates = materialDate && reviewDate
  const priceInfo =
    hasBothDates ? calcPrice(materialDate, reviewDate, 50000) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!clientName || !reviewDate) {
      setError('의뢰 닉네임과 검수 예정일은 필수입니다.')
      return
    }

    setSubmitting(true)
    const payload = {
      clientName,
      depositorName,
      status,
      reviewDate,
      materialReceivedDate: materialDate || undefined,
      memo,
    }

    const res =
      isEdit && editId
        ? await updateCommission(editId, payload)
        : await createCommission(payload)

    setSubmitting(false)

    if (!res.ok) {
      setError(`${isEdit ? '수정' : '등록'} 실패: ${res.error}`)
      return
    }

    alert(`커미션이 ${isEdit ? '수정' : '등록'}되었습니다.`)
    navigate('/admin')
  }

  const isBusy = submitting || loadingExisting

  return (
    <div className='page-shell'>
      <header className="page-header">
        <h1 className="page-title">
          {isEdit ? '커미션 수정' : '커미션 등록'}
        </h1>
        <p className="page-subtitle">
          검수 예정일을 먼저 잡아두고, 추후 자료 날짜를 입력하면 금액이 자동 계산됩니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="section-grid-2">
          <div className="space-y-2">
            <label className="form-label">
              의뢰 닉네임 <span className="text-teal-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="form-input"
              disabled={isBusy}
            />
          </div>
          <div className="space-y-2">
            <label className="form-label">입금자명</label>
            <input
              type="text"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="form-input"
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-label">상태</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as CommissionStatus)
            }
            className="form-select"
            disabled={isBusy}
          >
            <option value="PAID">입금 완료 (PAID)</option>
            <option value="REVIEW_REQUESTED">
              검수 요청 (REVIEW_REQUESTED)
            </option>
            <option value="DONE">최종 완료 (DONE)</option>
          </select>
        </div>

        <div className="section-grid-2">
          <div className="space-y-2">
            <label className="form-label">자료 받은 날짜</label>
            <input
              type="date"
              value={materialDate}
              onChange={(e) => setMaterialDate(e.target.value)}
              className="form-input"
              disabled={isBusy}
            />
          </div>
          <div className="space-y-2">
            <label className="form-label">
              검수 예정일 <span className="text-teal-500">*</span>
            </label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="form-input"
              required
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-label">메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="form-textarea min-h-[100px]"
            disabled={isBusy}
          />
        </div>

        {/* 가격 프리뷰 카드 */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-5 dark:border-teal-900/30 dark:bg-teal-900/10">
          <h3 className="mb-2 text-sm font-bold text-teal-800 dark:text-teal-200">
            💰 예상 견적
          </h3>
          {hasBothDates && priceInfo ? (
            <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <p>
                기간:{' '}
                <span className="font-medium">
                  {priceInfo.diffDays}일 소요
                </span>
              </p>
              <p>
                할증:{' '}
                <span className="font-medium">
                  {priceInfo.priceTier}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2 border-t border-teal-200 pt-2 dark:border-teal-800">
                <span>최종:</span>
                <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {priceInfo.finalPrice.toLocaleString()}원
                </span>
                <span className="text-xs text-slate-400">
                  (+{priceInfo.extraPrice.toLocaleString()})
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              날짜를 모두 입력하면 최종 금액이 계산됩니다. (현재 기본
              50,000원)
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-ghost"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="btn btn-primary px-5 py-2.5 disabled:opacity-50"
          >
            {isEdit
              ? submitting
                ? '수정 중...'
                : '수정 완료'
              : submitting
              ? '등록 중...'
              : '등록 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
