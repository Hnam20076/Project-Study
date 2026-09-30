import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code2, Table as TableIcon, Image as ImageIcon,
  Undo, Redo, History,
  RotateCw, Check, AlertTriangle
} from 'lucide-react'
import { pageRepo, versionRepo, imageRepo } from '@/db/repositories'
import { optimizeImage } from '@/services/imageOptimizer'
import { sanitizeHTML } from '@/lib/sanitize'
import { CustomImage } from './editor/CustomImage'
import { vi } from '@/i18n/vi'
import { debounce, formatTime, countWordsInHTML } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { NotePage, NoteVersion } from '@/types'

// Thời gian debounce autosave (ms)
const AUTOSAVE_DELAY = 1500

interface Props {
  pageId: string
}

type SaveStatus = 'dirty' | 'saving' | 'saved' | 'error'

export function PageEditor({ pageId }: Props) {
  const [page, setPage] = useState<NotePage | null>(null)
  const [title, setTitle] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const titleRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<{ content: string; title: string; dirty: boolean }>({
    content: '',
    title: '',
    dirty: false,
  })

  // Load trang
  useEffect(() => {
    pageRepo.getById(pageId).then(p => {
      if (p) {
        setPage(p)
        setTitle(p.title)
        setSavedAt(p.updatedAt)
        setSaveStatus('saved')
        pendingRef.current = { content: p.content, title: p.title, dirty: false }
      }
    })
  }, [pageId])

  // Flush ngay lập tức toàn bộ thay đổi chưa lưu vào DB
  const flushPending = useCallback(async () => {
    if (!pendingRef.current.dirty || !pageId) return
    const { content, title: curTitle } = pendingRef.current
    try {
      setSaveStatus('saving')
      const clean = sanitizeHTML(content)
      const wordCount = countWordsInHTML(clean)
      await pageRepo.update(pageId, { content: clean, title: curTitle, wordCount })
      await versionRepo.save(pageId, clean, wordCount)
      pendingRef.current.dirty = false
      setSavedAt(new Date())
      setSaveStatus('saved')
    } catch (e) {
      console.error('Flush failed', e)
      setSaveStatus('error')
    }
  }, [pageId])

  // Lưu nội dung với debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedAutosave = useCallback(
    debounce(async (id: string, content: string, titleStr: string) => {
      try {
        setSaveStatus('saving')
        const clean = sanitizeHTML(content)
        const wordCount = countWordsInHTML(clean)
        await pageRepo.update(id, { content: clean, title: titleStr, wordCount })
        await versionRepo.save(id, clean, wordCount)
        if (pendingRef.current.content === content && pendingRef.current.title === titleStr) {
          pendingRef.current.dirty = false
        }
        setSavedAt(new Date())
        setSaveStatus('saved')
      } catch (e) {
        console.error('Autosave failed', e)
        setSaveStatus('error')
      }
    }, AUTOSAVE_DELAY) as (id: string, content: string, titleStr: string) => void,
    []
  )

  const triggerChange = useCallback((newContent: string, newTitle: string) => {
    pendingRef.current = { content: newContent, title: newTitle, dirty: true }
    setSaveStatus('dirty')
    debouncedAutosave(pageId, newContent, newTitle)
  }, [pageId, debouncedAutosave])

  // Lắng nghe beforeunload, visibilitychange, unmount để flush bảo toàn dữ liệu
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPending()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPending()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushPending()
    }
  }, [flushPending])

  const handleInsertImageRef = useRef<(file: File | Blob) => Promise<void>>()

  // Editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Đã có history trong StarterKit
        history: {
          depth: 50,
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'prose-link' },
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Bắt đầu viết... (Ctrl+Z để undo, Ctrl+Shift+Z để redo)',
      }),
    ],
    content: page?.content ?? '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      triggerChange(html, titleRef.current?.value ?? title)
    },
    editorProps: {
      handlePaste: (_view, event) => {
        // Xử lý paste ảnh với tối ưu Canvas và IndexedDB
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              handleInsertImageRef.current?.(file)
            }
            return true
          }
        }
        return false
      },
      handleDrop: (_view, event) => {
        // Xử lý drop ảnh với tối ưu Canvas và IndexedDB
        const files = event.dataTransfer?.files
        if (!files) return false

        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            handleInsertImageRef.current?.(file)
            return true
          }
        }
        return false
      },
    },
  }, [page?.content]) // Tái tạo editor khi page thay đổi

  const handleInsertImageFile = useCallback(async (file: File | Blob) => {
    if (!editor || !pageId) return
    const toastId = toast.loading(vi.notes.editor.imageOptimizing)
    try {
      const optimized = await optimizeImage(file)
      const record = await imageRepo.save(
        pageId,
        optimized.blob,
        optimized.mimeType,
        optimized.fileName
      )
      editor.chain().focus().setImage({ src: `idb://${record.id}`, alt: record.fileName || '' }).run()
      toast.success(vi.notes.editor.imageInsertSuccess, { id: toastId })
    } catch (err) {
      console.error('Failed to insert image:', err)
      toast.error(vi.notes.editor.imageInsertFailed, { id: toastId })
    }
  }, [editor, pageId])

  useEffect(() => {
    handleInsertImageRef.current = handleInsertImageFile
  }, [handleInsertImageFile])

  // Load versions
  async function loadVersions() {
    const vs = await versionRepo.getByPage(pageId)
    setVersions(vs)
    setShowVersions(true)
  }

  // Restore version
  async function restoreVersion(content: string) {
    if (!editor) return
    editor.commands.setContent(content)
    await pageRepo.update(pageId, { content: sanitizeHTML(content) })
    setSavedAt(new Date())
    setShowVersions(false)
    toast.success('Đã khôi phục phiên bản')
  }

  // Lưu title khi thay đổi
  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    triggerChange(editor?.getHTML() ?? '', newTitle)
  }



  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="skeleton w-2/3 h-8 mb-4" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-bg">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
        {/* Format toolbar */}
        <div className="flex items-center gap-0.5 px-4 py-2 flex-wrap">
          {/* Undo/Redo */}
          <ToolbarGroup>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              title="Làm lại (Ctrl+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-slate-200 dark:bg-dark-border mx-1" />

          {/* Headings */}
          <ToolbarGroup>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor?.isActive('heading', { level: 1 })}
              title={vi.notes.editor.heading1}
            >
              <Heading1 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive('heading', { level: 2 })}
              title={vi.notes.editor.heading2}
            >
              <Heading2 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor?.isActive('heading', { level: 3 })}
              title={vi.notes.editor.heading3}
            >
              <Heading3 className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-slate-200 dark:bg-dark-border mx-1" />

          {/* Text formatting */}
          <ToolbarGroup>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title={vi.notes.editor.bold}
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title={vi.notes.editor.italic}
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              title={vi.notes.editor.underline}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive('strike')}
              title={vi.notes.editor.strike}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              active={editor?.isActive('highlight')}
              title={vi.notes.editor.highlight}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleCode().run()}
              active={editor?.isActive('code')}
              title={vi.notes.editor.code}
            >
              <Code className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-slate-200 dark:bg-dark-border mx-1" />

          {/* Lists */}
          <ToolbarGroup>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title={vi.notes.editor.bulletList}
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title={vi.notes.editor.orderedList}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              active={editor?.isActive('taskList')}
              title={vi.notes.editor.taskList}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </ToolbarGroup>

          <div className="w-px h-5 bg-slate-200 dark:bg-dark-border mx-1" />

          {/* Blocks */}
          <ToolbarGroup>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              title={vi.notes.editor.blockquote}
            >
              <Quote className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive('codeBlock')}
              title={vi.notes.editor.codeBlock}
            >
              <Code2 className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title={vi.notes.editor.table}
              aria-label={vi.notes.editor.table}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => fileInputRef.current?.click()}
              title={vi.notes.editor.image}
              aria-label={vi.notes.editor.image}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </ToolbarBtn>
          </ToolbarGroup>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Tải lên ảnh ghi chú"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleInsertImageFile(file)
                e.target.value = ''
              }
            }}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Version history */}
          <button
            onClick={loadVersions}
            className="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1"
            title={vi.notes.versions}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{vi.notes.versions}</span>
          </button>

          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs pl-2">
            {saveStatus === 'dirty' && (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Đang chỉnh sửa</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-blue-500 font-medium">
                <RotateCw className="w-3 h-3 animate-spin" />
                <span>Đang lưu…</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu{savedAt ? ` lúc ${formatTime(savedAt)}` : ''}</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Chưa lưu</span>
                <button
                  type="button"
                  onClick={() => flushPending()}
                  className="underline hover:text-rose-600 ml-1"
                >
                  Thử lại
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Title */}
          <input
            ref={titleRef}
            className="w-full text-3xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none outline-none mb-6 placeholder:text-slate-300"
            placeholder={vi.common.untitled}
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
          />

          {/* TipTap Editor */}
          {editor && (
            <EditorContent
              editor={editor}
              className="tiptap-editor prose"
            />
          )}

          {/* Word count */}
          {editor && (
            <div className="mt-4 text-xs text-slate-400 text-right">
              {editor.storage.characterCount?.words()} từ
            </div>
          )}
        </div>
      </div>

      {/* Version history panel */}
      {showVersions && (
        <div className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border shadow-xl z-20 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-border">
            <span className="font-semibold text-sm">{vi.notes.versions}</span>
            <button onClick={() => setShowVersions(false)} className="btn-ghost p-1">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {versions.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Chưa có phiên bản nào</div>
            ) : (
              versions.map(v => (
                <button
                  key={v.id}
                  onClick={() => restoreVersion(v.content)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-dark-border hover:border-primary-300 transition-colors"
                >
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {vi.notes.versionAt} {formatTime(v.savedAt)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {v.wordCount ?? 0} từ
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper components
function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function ToolbarBtn({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active
          ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted hover:text-slate-700',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}
