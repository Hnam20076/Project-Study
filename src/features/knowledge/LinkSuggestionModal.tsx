import React, { useState, useMemo } from 'react'
import { X, Sparkles, Plus, ArrowRight } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { suggestLinksByCommonTags } from './pathfinding'
import { RELATION_LABELS, type KnowledgeNode, type KnowledgeEdge, type KnowledgeRelationKind } from '@/types'

interface Props {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  onClose: () => void
  onAddEdge: (fromId: string, toId: string, kind: KnowledgeRelationKind) => void
}

export const LinkSuggestionModal: React.FC<Props> = ({
  nodes,
  edges,
  onClose,
  onAddEdge,
}) => {
  const initialSuggestions = useMemo(() => suggestLinksByCommonTags(nodes, edges), [nodes, edges])
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [selectedKinds, setSelectedKinds] = useState<Record<string, KnowledgeRelationKind>>({})

  const handleCreate = (fromId: string, toId: string, key: string) => {
    const kind = selectedKinds[key] || 'Related'
    onAddEdge(fromId, toId, kind)
    setSuggestions(prev => prev.filter(s => `${s.nodeA.id}-${s.nodeB.id}` !== key))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg p-6 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-3">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
              {vi.knowledge.linkSuggestions}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Hệ thống phát hiện các điểm tri thức có chung thẻ tag nhưng chưa được kết nối trong mạng lưới:
        </p>

        {/* Danh sách gợi ý */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {suggestions.map(s => {
            const key = `${s.nodeA.id}-${s.nodeB.id}`
            const currentKind = selectedKinds[key] || 'Related'

            return (
              <div
                key={key}
                className="p-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center gap-1.5 min-w-0 font-medium text-slate-800 dark:text-slate-200">
                    <span className="truncate">{s.nodeA.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{s.nodeB.title}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold text-[10px] flex-shrink-0">
                    {s.commonTags.length} {vi.knowledge.commonTags}
                  </span>
                </div>

                {/* Common tags */}
                <div className="flex flex-wrap gap-1">
                  {s.commonTags.map(t => (
                    <span
                      key={t}
                      className="px-1.5 py-0.2 rounded bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Relation Kind & Button */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="input py-1 text-xs flex-1"
                    value={currentKind}
                    onChange={e =>
                      setSelectedKinds(prev => ({
                        ...prev,
                        [key]: e.target.value as KnowledgeRelationKind,
                      }))
                    }
                  >
                    {(Object.keys(RELATION_LABELS) as KnowledgeRelationKind[]).map(k => (
                      <option key={k} value={k}>
                        {RELATION_LABELS[k]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleCreate(s.nodeA.id, s.nodeB.id, key)}
                    className="btn-primary py-1 px-3 text-xs flex items-center gap-1 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{vi.knowledge.createLink}</span>
                  </button>
                </div>
              </div>
            )
          })}

          {suggestions.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tất cả các điểm tri thức có chung tag đã được kết nối đầy đủ!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
