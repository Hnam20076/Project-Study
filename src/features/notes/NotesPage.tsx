import { useState, useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, ChevronRight, ChevronDown, BookOpen,
  FileText, Trash2, Edit2, Search
} from 'lucide-react'
import { notebookRepo, sectionRepo, pageRepo } from '@/db/repositories'
import { getAllSections } from '@/db/sectionHelpers'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Notebook, NoteSection, NotePage } from '@/types'
import { toast } from 'sonner'
import { PageEditor } from './PageEditor'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Panel cây notebook bên trái
function NotebookTree({
  selectedPageId,
  onSelectPage,
}: {
  selectedPageId: string | null
  onSelectPage: (pageId: string, sectionId: string) => void
}) {
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const notebooks = useLiveQuery(() => notebookRepo.getAll(), []) ?? []
  const allSections = useLiveQuery(() => getAllSections(), []) ?? []
  const allPages = useLiveQuery(() => pageRepo.getRecent(100), []) ?? []

  // Lọc theo search
  const filteredPages = searchQuery
    ? allPages.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : null

  async function createNotebook() {
    const name = `Notebook ${notebooks.length + 1}`
    const maxOrder = await notebookRepo.getMaxOrder()
    await notebookRepo.create({
      name,
      color: '#6366f1',
      order: maxOrder + 1,
      tags: [],
      isDemo: false,
    })
    toast.success(`Đã tạo ${name}`)
  }

  async function createSection(notebookId: string) {
    const name = 'Section mới'
    const maxOrder = await sectionRepo.getMaxOrder(notebookId)
    const section = await sectionRepo.create({
      name,
      notebookId,
      order: maxOrder + 1,
      tags: [],
      isDemo: false,
    })
    setExpandedSections(prev => new Set([...prev, notebookId]))
    // Expand notebook
    setExpandedNotebooks(prev => new Set([...prev, notebookId]))
    toast.success(`Đã tạo section`)
    // Tự động bắt đầu edit tên
    setEditingId(section.id)
    setEditName(name)
  }

  async function createPage(sectionId: string, notebookId: string) {
    const maxOrder = await pageRepo.getMaxOrder(sectionId)
    const page = await pageRepo.create({
      title: 'Trang mới',
      content: '',
      sectionId,
      notebookId,
      order: maxOrder + 1,
      tags: [],
      isDemo: false,
    })
    setExpandedSections(prev => new Set([...prev, sectionId]))
    onSelectPage(page.id, sectionId)
    toast.success('Đã tạo trang mới')
  }

  async function handleRename(type: 'notebook' | 'section' | 'page', id: string) {
    if (!editName.trim()) return
    try {
      if (type === 'notebook') {
        await notebookRepo.update(id, { name: editName })
      } else if (type === 'section') {
        await sectionRepo.update(id, { name: editName })
      } else {
        await pageRepo.update(id, { title: editName })
      }
      setEditingId(null)
    } catch {
      toast.error(vi.errors.saveFailed)
    }
  }

  async function handleDeleteNotebook(nb: Notebook) {
    const ok = window.confirm(vi.dialog.deleteMessage)
    if (!ok) return
    await notebookRepo.delete(nb.id)
    toast.success(vi.toast.deleted)
  }

  async function handleDeleteSection(section: NoteSection) {
    const ok = window.confirm(vi.dialog.deleteMessage)
    if (!ok) return
    await sectionRepo.delete(section.id)
    toast.success(vi.toast.deleted)
  }

  async function handleDeletePage(page: NotePage) {
    const ok = window.confirm(vi.dialog.deleteMessage)
    if (!ok) return
    await pageRepo.delete(page.id)
    toast.success(vi.toast.deleted)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-dark-border">
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          {vi.notes.title}
        </span>
        <button onClick={createNotebook} className="btn-ghost p-1.5" title={vi.notes.newNotebook}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="input pl-8 py-1.5 text-xs"
            placeholder={vi.notes.searchNotes}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tree / Search results */}
      <div className="flex-1 overflow-y-auto">
        {filteredPages ? (
          // Hiển thị kết quả tìm kiếm
          <div className="px-2 py-1 space-y-0.5">
            {filteredPages.length === 0 ? (
              <div className="text-xs text-slate-400 px-3 py-4 text-center">
                {vi.common.noResults}
              </div>
            ) : (
              filteredPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.id, page.sectionId)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                    selectedPageId === page.id
                      ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="font-medium truncate">{page.title || vi.common.untitled}</div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Cây notebook
          <div className="px-2 py-1 space-y-0.5">
            {notebooks.length === 0 ? (
              <div className="text-xs text-slate-400 px-3 py-8 text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>{vi.notes.noNotebooks}</p>
                <button
                  onClick={createNotebook}
                  className="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + {vi.notes.newNotebook}
                </button>
              </div>
            ) : (
              notebooks.map(notebook => {
                const isExpanded = expandedNotebooks.has(notebook.id)
                const notebookSections = allSections.filter(s => s.notebookId === notebook.id)

                return (
                  <div key={notebook.id}>
                    {/* Notebook */}
                    <div className="group flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted">
                      <button
                        onClick={() => setExpandedNotebooks(prev => {
                          const next = new Set(prev)
                          if (next.has(notebook.id)) next.delete(notebook.id)
                          else next.add(notebook.id)
                          return next
                        })}
                        className="flex items-center gap-1.5 flex-1 min-w-0"
                      >
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        }
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: notebook.color }}
                        />
                        {editingId === notebook.id ? (
                          <input
                            autoFocus
                            className="flex-1 text-xs bg-transparent border-b border-primary-400 outline-none"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={() => handleRename('notebook', notebook.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename('notebook', notebook.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : (
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {notebook.name}
                          </span>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={() => { setEditingId(notebook.id); setEditName(notebook.name) }}
                          className="p-0.5 hover:text-primary-600 text-slate-400"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => createSection(notebook.id)}
                          className="p-0.5 hover:text-primary-600 text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotebook(notebook)}
                          className="p-0.5 hover:text-red-500 text-slate-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Sections */}
                    {isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {notebookSections.map(section => {
                          const isSecExpanded = expandedSections.has(section.id)
                          const sectionPages = allPages.filter(p => p.sectionId === section.id)

                          return (
                            <div key={section.id}>
                              {/* Section */}
                              <div className="group flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted">
                                <button
                                  onClick={() => setExpandedSections(prev => {
                                    const next = new Set(prev)
                                    if (next.has(section.id)) next.delete(section.id)
                                    else next.add(section.id)
                                    return next
                                  })}
                                  className="flex items-center gap-1.5 flex-1 min-w-0"
                                >
                                  {isSecExpanded
                                    ? <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    : <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  }
                                  {editingId === section.id ? (
                                    <input
                                      autoFocus
                                      className="flex-1 text-xs bg-transparent border-b border-primary-400 outline-none"
                                      value={editName}
                                      onChange={e => setEditName(e.target.value)}
                                      onBlur={() => handleRename('section', section.id)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleRename('section', section.id)
                                        if (e.key === 'Escape') setEditingId(null)
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                      {section.name}
                                    </span>
                                  )}
                                </button>

                                <div className="hidden group-hover:flex items-center gap-0.5">
                                  <button
                                    onClick={() => { setEditingId(section.id); setEditName(section.name) }}
                                    className="p-0.5 hover:text-primary-600 text-slate-400"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => createPage(section.id, section.notebookId)}
                                    className="p-0.5 hover:text-primary-600 text-slate-400"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSection(section)}
                                    className="p-0.5 hover:text-red-500 text-slate-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Pages */}
                              {isSecExpanded && (
                                <div className="ml-4 space-y-0.5">
                                  {sectionPages.map(page => (
                                    <div
                                      key={page.id}
                                      className={cn(
                                        'group flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors',
                                        selectedPageId === page.id
                                          ? 'bg-primary-50 dark:bg-primary-950/30'
                                          : 'hover:bg-slate-100 dark:hover:bg-dark-muted'
                                      )}
                                      onClick={() => onSelectPage(page.id, section.id)}
                                    >
                                      <FileText className={cn(
                                        'w-3 h-3 flex-shrink-0',
                                        selectedPageId === page.id
                                          ? 'text-primary-500'
                                          : 'text-slate-400'
                                      )} />
                                      {editingId === page.id ? (
                                        <input
                                          autoFocus
                                          className="flex-1 text-xs bg-transparent border-b border-primary-400 outline-none"
                                          value={editName}
                                          onChange={e => setEditName(e.target.value)}
                                          onBlur={() => handleRename('page', page.id)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') handleRename('page', page.id)
                                            if (e.key === 'Escape') setEditingId(null)
                                          }}
                                          onClick={e => e.stopPropagation()}
                                        />
                                      ) : (
                                        <span className={cn(
                                          'text-xs truncate flex-1',
                                          selectedPageId === page.id
                                            ? 'text-primary-700 dark:text-primary-300 font-medium'
                                            : 'text-slate-600 dark:text-slate-400'
                                        )}>
                                          {page.title || vi.common.untitled}
                                        </span>
                                      )}
                                      {page.isDemo && (
                                        <span className="badge-demo text-[10px]">{vi.demo.badge}</span>
                                      )}

                                      <div className="hidden group-hover:flex items-center gap-0.5">
                                        <button
                                          onClick={e => {
                                            e.stopPropagation()
                                            setEditingId(page.id)
                                            setEditName(page.title)
                                          }}
                                          className="p-0.5 hover:text-primary-600 text-slate-400"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDeletePage(page) }}
                                          className="p-0.5 hover:text-red-500 text-slate-400"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {sectionPages.length === 0 && (
                                    <button
                                      onClick={() => createPage(section.id, section.notebookId)}
                                      className="w-full text-left px-2 py-1 text-xs text-slate-400 hover:text-primary-600 transition-colors"
                                    >
                                      + {vi.notes.newPage}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Gợi ý drag-to-sort (Phase sau) */}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-dark-border">
        <div className="text-xs text-slate-400">
          ⠿ Kéo thả để sắp xếp (sắp ra mắt)
        </div>
      </div>
    </div>
  )
}

// Trang chính Notes
function NotesContent() {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)

  // Resize sidebar
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = sidebarWidth

    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - startX
      setSidebarWidth(Math.max(180, Math.min(400, startWidth + delta)))
    }

    function onMouseUp() {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [sidebarWidth])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Notebook tree sidebar */}
      <div
        className="hidden md:flex flex-col border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        <NotebookTree
          selectedPageId={selectedPageId}
          onSelectPage={(pageId, _sectionId) => {
            setSelectedPageId(pageId)
          }}
        />
      </div>

      {/* Resize handle */}
      <div
        className="hidden md:block w-1 cursor-col-resize hover:bg-primary-400 transition-colors bg-transparent"
        onMouseDown={startResize}
        style={{ cursor: isResizing ? 'col-resize' : undefined }}
      />

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {selectedPageId ? (
          <PageEditor
            pageId={selectedPageId}
            key={selectedPageId} // Remount khi đổi trang
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{vi.notes.noPages}</p>
            <p className="text-xs mt-1">Chọn hoặc tạo trang mới từ panel bên trái</p>
          </div>
        )}
      </div>

      {/* Mobile: notebook tree */}
      {!selectedPageId && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-dark-surface z-10">
          <NotebookTree
            selectedPageId={selectedPageId}
            onSelectPage={(pageId, _sectionId) => {
              setSelectedPageId(pageId)
            }}
          />
        </div>
      )}
    </div>
  )
}

export function NotesPage() {
  return (
    <ErrorBoundary moduleName={vi.nav.notes}>
      <NotesContent />
    </ErrorBoundary>
  )
}
