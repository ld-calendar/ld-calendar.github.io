// src/components/RichTextEditor.tsx
import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

const COLOR_PRESETS = [
  { label: '기본', value: '' }, // reset
  { label: '빨강', value: '#DC2626' },
  { label: '주황', value: '#F97316' },
  { label: '초록', value: '#16A34A' },
  { label: '파랑', value: '#2563EB' },
  { label: '보라', value: '#7C3AED' },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요.',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      // 색상
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,

      // 정렬(문단/헤딩)
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),

      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // disabled 변경 시 editable 동기화
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  // 외부 value 바뀔 때 (수정 모드 등)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === (value || '')) return
    editor.commands.setContent(value || '')
  }, [value, editor])

  if (!editor) return null

  const toggleBlock =
    (cmd: () => void) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      if (disabled) return
      cmd()
    }

  const setColor = (color: string) => {
    if (disabled) return
    if (color) {
      editor.chain().focus().setColor(color).run()
    } else {
      editor.chain().focus().unsetColor().run()
    }
  }

  const setAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (disabled) return
    editor.chain().focus().setTextAlign(align).run()
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-900">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-800">
        {/* B / I */}
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleBold().run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('bold')
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          B
        </button>
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleItalic().run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('italic')
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          I
        </button>

        <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 리스트 */}
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleBulletList().run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('bulletList')
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          • List
        </button>
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleOrderedList().run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('orderedList')
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          1. List
        </button>

        <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 본문 / 헤딩 */}
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().setParagraph().run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('paragraph')
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          본문
        </button>
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          onClick={toggleBlock(() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
          )}
          className={`rounded px-2 py-1 ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          disabled={disabled}
        >
          H3
        </button>

        <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 정렬 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAlign('left')}
            className={`rounded px-2 py-1 ${
              editor.isActive({ textAlign: 'left' }) || !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' })
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            disabled={disabled}
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => setAlign('center')}
            className={`rounded px-2 py-1 ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            disabled={disabled}
          >
            ⬌
          </button>
          <button
            type="button"
            onClick={() => setAlign('right')}
            className={`rounded px-2 py-1 ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            disabled={disabled}
          >
            ➡
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 글자 색상 */}
        <div className="flex items-center gap-1">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setColor(c.value)}
              className={`flex h-7 items-center rounded px-2 ${
                c.value
                  ? 'border border-slate-200 dark:border-slate-600'
                  : 'border border-slate-200 text-[11px] text-slate-500 dark:border-slate-600'
              }`}
              disabled={disabled}
            >
              {c.value ? (
                <span
                  className="text-xs font-semibold"
                  style={{ color: c.value }}
                >
                  A
                </span>
              ) : (
                <span className="text-[11px]">기본</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="max-h-[400px] overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-3 py-2 text-slate-800 focus:outline-none dark:prose-invert dark:text-slate-100"
        />
      </div>
    </div>
  )
}
