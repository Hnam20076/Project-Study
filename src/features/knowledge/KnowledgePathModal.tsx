import React, { useState } from 'react'
import { X, Route, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { findPrerequisitePath, type PathResult } from './pathfinding'
import type { KnowledgeNode, KnowledgeEdge } from '@/types'

interface Props {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  onClose: () => void
  onHighlightPath: (path: PathResult) => void
}

export const KnowledgePathModal: React.FC<Props> = ({
  nodes,
  edges,
  onClose,
  onHighlightPath,
}) => {
  const [startId, setStartId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [result, setResult] = useState<PathResult | null | undefined>(undefined)

  const nodeMap = new Map<string, KnowledgeNode>()
  nodes.forEach(n => nodeMap.set(n.id, n))

  const handleFindPath = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startId || !targetId) return

    const res = findPrerequisitePath(startId, targetId, edges)
    setResult(res)
    if (res) {
      onHighlightPath(res)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-4">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Route className="w-5 h-5" />
            <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
              {vi.knowledge.knowledgePath}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFindPath} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.startNode}
            </label>
            <select
              className="input text-xs"
              value={startId}
              onChange={e => {
                setStartId(e.target.value)
                setResult(undefined)
              }}
              required
            >
              <option value="">-- Chọn kiến thức nền tảng ban đầu --</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.endNode}
            </label>
            <select
              className="input text-xs"
              value={targetId}
              onChange={e => {
                setTargetId(e.target.value)
                setResult(undefined)
              }}
              required
            >
              <option value="">-- Chọn kiến thức mục tiêu cần đạt --</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary w-full py-2 text-xs">
            {vi.knowledge.findPath}
          </button>
        </form>

        {/* Kết quả tìm kiếm lộ trình */}
        {result !== undefined && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-dark-border text-xs">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Tìm thấy lộ trình {result.nodeIds.length} bước học tuần tự:
                  </span>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
                  {result.nodeIds.map((nId, idx) => {
                    const n = nodeMap.get(nId)
                    return (
                      <div key={nId} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {n?.title || nId}
                        </span>
                        {idx < result.nodeIds.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onHighlightPath(result)
                    onClose()
                  }}
                  className="btn-secondary w-full text-xs py-1.5"
                >
                  Tô sáng & xem trên đồ thị
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{vi.knowledge.noPathFound}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
