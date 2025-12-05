// src/pages/AdminNoticeFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createNotice, updateNotice, fetchNotices } from '../api/sheet'
import type { Notice } from '../types'
import { RichTextEditor } from '../components/RichTextEditor'
import { normalizeNotices } from '../utils/notice'

export function AdminNoticeFormPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('') // HTML 문자열
  const [isPinned, setIsPinned] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const isEdit = !!editId

  useEffect(() => {
    if (!isEdit || !editId) return

    async function loadExisting() {
      setLoadingExisting(true)
      setError(null)
      const res = await fetchNotices()
      if (!res.ok) {
        setError(`기존 공지를 불러오지 못했습니다: ${res.error}`)
        setLoadingExisting(false)
        return
      }

      const normalized = normalizeNotices(res.data)
      const target = normalized.find((n: Notice) => n.id === editId)
      if (!target) {
        setError('해당 공지를 찾을 수 없습니다.')
        setLoadingExisting(false)
        return
      }

      setTitle(target.title)
      setBody(target.body || '')
      setIsPinned(target.isPinned)
      setIsActive(target.isActive)
      setLoadingExisting(false)
    }

    loadExisting()
  }, [isEdit, editId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title || !body) {
      setError('제목과 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    const payload = {
      title,
      body, // HTML 그대로 저장
      isPinned,
      isActive,
    }

    const res =
      isEdit && editId
        ? await updateNotice(editId, payload)
        : await createNotice(payload)

    setSubmitting(false)

    if (!res.ok) {
      setError(`${isEdit ? '수정' : '등록'} 실패: ${res.error}`)
      return
    }

    alert(`공지사항이 ${isEdit ? '수정' : '등록'}되었습니다.`)
    navigate('/notices')
  }

  const isBusy = submitting || loadingExisting

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">
          {isEdit ? '공지사항 수정' : '공지사항 등록'}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? '기존 공지 내용을 수정합니다.'
            : '새로운 공지나 마감 안내를 작성합니다.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="form-label">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="예) 12월 커미션 예약 오픈 안내"
            disabled={isBusy}
          />
        </div>

        <div className="space-y-2">
          <label className="form-label">내용</label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="내용을 자유롭게 작성하세요."
            disabled={isBusy}
          />
        </div>

        <div className="flex gap-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="form-check"
              disabled={isBusy}
            />
            <span>상단 고정 (중요 공지)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="form-check"
              disabled={isBusy}
            />
            <span>게시 상태 (체크 해제 시 비공개)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/notices')}
            className="btn btn-ghost"
            disabled={isBusy}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="btn btn-primary disabled:opacity-50"
          >
            {isEdit
              ? submitting
                ? '수정 중...'
                : '수정 완료'
              : submitting
              ? '등록 중...'
              : '공지 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
