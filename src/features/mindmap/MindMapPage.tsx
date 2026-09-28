import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ReactFlowProvider } from '@xyflow/react'
import { mindmapRepo } from '@/db/repositories'
import { MindMapCanvas } from './MindMapCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { vi } from '@/i18n/vi'
import { Plus, Trash2, Edit2, Network, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { MindMap } from '@/types'

const MindMapContent: React.FC = () => {
  const mindmaps = useLiveQuery(() => mindmapRepo.getAll(), []) ?? []
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Mặc định chọn sơ đồ đầu tiên nếu có
  useEffect(() => {
    if (mindmaps.length > 0 && !selectedMapId) {
      setSelectedMapId(mindmaps[0].id)
    }
  }, [mindmaps, selectedMapId])

  const currentMap = mindmaps.find(m => m.id === selectedMapId) || null

  const handleCreateNew = async () => {
    const rootId = `root-${Date.now()}`
    const newMap = await mindmapRepo.create({
      name: `Sơ đồ tư duy ${mindmaps.length + 1}`,
      tags: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        {
          id: rootId,
          label: 'Chủ đề chính',
          color: '#6366f1',
          x: 0,
          y: 0,
        },
      ],
      edges: [],
    })
    setSelectedMapId(newMap.id)
    toast.success(vi.toast.created)
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!window.confirm(vi.dialog.deleteMessage)) return

    await mindmapRepo.delete(id)
    toast.success(vi.toast.deleted)
    if (selectedMapId === id) {
      const remaining = mindmaps.filter(m => m.id !== id)
      setSelectedMapId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleUpdate = async (updated: MindMap) => {
    await mindmapRepo.update(updated.id, updated)
  }

  const handleRenameSubmit = async () => {
    if (!currentMap || !titleInput.trim()) {
      setIsEditingTitle(false)
      return
    }
    await mindmapRepo.update(currentMap.id, { name: titleInput.trim() })
    setIsEditingTitle(false)
    toast.success(vi.toast.updated)
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Network className="w-5 h-5 flex-shrink-0" />
            <h1 className="font-bold text-base hidden sm:inline text-slate-800 dark:text-slate-100">
              {vi.mindmap.title}
            </h1>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-dark-border hidden sm:block" />

          {/* Switcher & Name */}
          {currentMap ? (
            <div className="relative">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    className="input py-1 px-2 text-sm w-48 sm:w-64"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameSubmit()
                      if (e.key === 'Escape') setIsEditingTitle(false)
                    }}
                  />
                  <button
                    onClick={handleRenameSubmit}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted font-semibold text-sm text-slate-800 dark:text-slate-100"
                  >
                    <span className="max-w-[160px] sm:max-w-xs truncate">{currentMap.name}</span>
                    {currentMap.isDemo && (
                      <span className="badge-demo text-[10px] ml-1">{vi.demo.badge}</span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setTitleInput(currentMap.name)
                      setIsEditingTitle(true)
                    }}
                    className="p-1 text-slate-400 hover:text-primary-600 rounded hover:bg-slate-100 dark:hover:bg-dark-muted"
                    title={vi.common.rename}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(currentMap.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-dark-muted"
                    title={vi.common.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Dropdown danh sách sơ đồ */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1 w-64 max-h-72 overflow-y-auto bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-xl z-30 p-1">
                    <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase">
                      Danh sách sơ đồ ({mindmaps.length})
                    </div>
                    {mindmaps.map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMapId(m.id)
                          setIsDropdownOpen(false)
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          m.id === selectedMapId
                            ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-dark-muted text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate flex-1">{m.name}</span>
                        {m.isDemo && (
                          <span className="badge-demo text-[9px] mr-1">{vi.demo.badge}</span>
                        )}
                        <button
                          onClick={e => handleDelete(m.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 dark:border-dark-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          handleCreateNew()
                          setIsDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{vi.mindmap.newMap}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400">{vi.mindmap.noMaps}</span>
          )}
        </div>

        {/* Nút tạo mới */}
        <button onClick={handleCreateNew} className="btn-primary text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{vi.mindmap.newMap}</span>
        </button>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {currentMap ? (
          <ReactFlowProvider key={currentMap.id}>
            <MindMapCanvas mindmap={currentMap} onSave={handleUpdate} />
          </ReactFlowProvider>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Network className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{vi.mindmap.noMaps}</p>
            <button onClick={handleCreateNew} className="btn-primary mt-3 text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>{vi.mindmap.newMap}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const MindMapPage: React.FC = () => {
  return (
    <ErrorBoundary moduleName={vi.nav.mindmap}>
      <MindMapContent />
    </ErrorBoundary>
  )
}
