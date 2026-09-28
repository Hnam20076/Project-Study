import React, { useState } from 'react'
import {
  X,
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import {
  RELATION_LABELS,
  RELATION_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type KnowledgeNode,
  type KnowledgeEdge,
  type KnowledgeRelationKind,
  type NotePage,
} from '@/types'
import { useNavigate } from 'react-router-dom'

interface Props {
  node: KnowledgeNode
  allNodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  relatedNotes: NotePage[]
  onClose: () => void
  onEdit: (node: KnowledgeNode) => void
  onDelete: (id: string) => void
  onAddEdge: (fromId: string, toId: string, kind: KnowledgeRelationKind) => void
  onDeleteEdge: (edgeId: string) => void
  onSelectNode: (nodeId: string) => void
}

export const KnowledgeDetailPanel: React.FC<Props> = ({
  node,
  allNodes,
  edges,
  relatedNotes,
  onClose,
  onEdit,
  onDelete,
  onAddEdge,
  onDeleteEdge,
  onSelectNode,
}) => {
  const navigate = useNavigate()
  const [newTargetId, setNewTargetId] = useState('')
  const [newKind, setNewKind] = useState<KnowledgeRelationKind>('Prerequisite')

  // Các cạnh xuất phát từ node này (node -> other)
  const outgoingEdges = edges.filter(e => e.fromNodeId === node.id)
  // Các cạnh đi tới node này (other -> node)
  const incomingEdges = edges.filter(e => e.toNodeId === node.id)

  const nodeMap = new Map<string, KnowledgeNode>()
  allNodes.forEach(n => nodeMap.set(n.id, n))

  const handleAddRelation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTargetId || newTargetId === node.id) return
    onAddEdge(node.id, newTargetId, newKind)
    setNewTargetId('')
  }

  const diffColor = DIFFICULTY_COLORS[node.difficulty] || '#6366f1'
  const diffLabel = DIFFICULTY_LABELS[node.difficulty] || 'Cơ bản'

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-dark-card border-l border-slate-200 dark:border-dark-border shadow-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
            style={{ backgroundColor: diffColor }}
          >
            {diffLabel}
          </span>
          {node.verified === false ? (
            <span
              className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
              title="Chưa xác minh — đối chiếu datasheet"
            >
              <AlertCircle className="w-3 h-3" />
              Chưa xác minh
            </span>
          ) : (
            <span className="text-emerald-500" title="Đã xác minh chính xác">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(node)}
            className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-muted"
            title={vi.common.edit}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(vi.dialog.deleteMessage)) {
                onDelete(node.id)
                onClose()
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-muted"
            title={vi.common.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-muted"
            title={vi.knowledge.closeDetails}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Title */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {node.title}
          </h2>
          {node.isDemo && (
            <span className="badge-demo text-[10px] mt-1">{vi.demo.badge}</span>
          )}
        </div>

        {/* Warning if unverified */}
        {node.verified === false && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{vi.knowledge.unverifiedNotice}</div>
          </div>
        )}

        {/* Formula */}
        {node.formulaLatex && (
          <div className="p-3 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border text-center">
            <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
              {vi.knowledge.formula}
            </div>
            <KatexMath math={node.formulaLatex} block />
          </div>
        )}

        {/* Description */}
        <div>
          <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
            {vi.knowledge.description}
          </div>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {node.description}
          </p>
        </div>

        {/* Examples */}
        {node.examples && (
          <div>
            <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              {vi.knowledge.examples}
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {node.examples}
            </div>
          </div>
        )}

        {/* Source & References */}
        {(node.source || node.references || node.sourceUrl) && (
          <div>
            <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              {vi.knowledge.references}
            </div>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              {node.source && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Nguồn: </span>
                  {node.source}
                </div>
              )}
              {node.references && <div>{node.references}</div>}
              {node.sourceUrl && (
                <a
                  href={node.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline pt-0.5"
                >
                  <span>Xem tài liệu gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {node.tags.map(t => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 text-[10px] font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Relations Section */}
        <div className="pt-2 border-t border-slate-200 dark:border-dark-border">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
            <span>{vi.knowledge.relations}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {outgoingEdges.length + incomingEdges.length} kết nối
            </span>
          </div>

          {/* List of relations */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
            {outgoingEdges.map(e => {
              const targetNode = nodeMap.get(e.toNodeId)
              if (!targetNode) return null
              const color = RELATION_COLORS[e.kind as KnowledgeRelationKind] || '#6366f1'
              const label = RELATION_LABELS[e.kind as KnowledgeRelationKind] || e.kind

              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectNode(targetNode.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate hover:text-primary-600">
                        {targetNode.title}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEdge(e.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title="Xóa liên kết"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}

            {incomingEdges.map(e => {
              const srcNode = nodeMap.get(e.fromNodeId)
              if (!srcNode) return null
              const color = RELATION_COLORS[e.kind as KnowledgeRelationKind] || '#6366f1'
              const label = RELATION_LABELS[e.kind as KnowledgeRelationKind] || e.kind

              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectNode(srcNode.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate hover:text-primary-600">
                        {srcNode.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEdge(e.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title="Xóa liên kết"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}

            {outgoingEdges.length === 0 && incomingEdges.length === 0 && (
              <div className="text-slate-400 text-center py-2 text-[11px]">
                Chưa có liên kết quan hệ nào
              </div>
            )}
          </div>

          {/* Form thêm quan hệ mới */}
          <form onSubmit={handleAddRelation} className="space-y-1.5 p-2 bg-slate-50 dark:bg-dark-surface rounded-lg border border-slate-200 dark:border-dark-border">
            <div className="text-[10px] font-semibold text-slate-500">
              {vi.knowledge.addRelation}:
            </div>
            <select
              className="input py-1 text-xs"
              value={newKind}
              onChange={e => setNewKind(e.target.value as KnowledgeRelationKind)}
            >
              {(Object.keys(RELATION_LABELS) as KnowledgeRelationKind[]).map(k => (
                <option key={k} value={k}>
                  {RELATION_LABELS[k]}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <select
                className="input py-1 text-xs flex-1"
                value={newTargetId}
                onChange={e => setNewTargetId(e.target.value)}
              >
                <option value="">-- {vi.knowledge.targetNode} --</option>
                {allNodes
                  .filter(n => n.id !== node.id)
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={!newTargetId}
                className="btn-primary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Cross-module: Related Notes */}
        <div className="pt-2 border-t border-slate-200 dark:border-dark-border">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>{vi.knowledge.relatedNotes}</span>
          </div>
          {relatedNotes.length > 0 ? (
            <div className="space-y-1">
              {relatedNotes.map(n => (
                <div
                  key={n.id}
                  onClick={() => navigate('/notes')}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 cursor-pointer transition-colors"
                >
                  <span className="font-medium text-emerald-800 dark:text-emerald-300 truncate">
                    {n.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              Không tìm thấy ghi chú có tag tương ứng
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
