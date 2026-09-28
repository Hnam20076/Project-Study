import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KatexMath } from '@/components/KatexMath'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/types'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { KnowledgeNode } from '@/types'

export interface KnowledgeNodeCustomData extends KnowledgeNode {
  isHighlighted?: boolean
  onClickDetail?: (node: KnowledgeNode) => void
}

export const KnowledgeCustomNode: React.FC<NodeProps> = memo(({ data: rawData, selected }) => {
  const data = rawData as unknown as KnowledgeNodeCustomData

  const diffColor = DIFFICULTY_COLORS[data.difficulty] || '#6366f1'
  const diffLabel = DIFFICULTY_LABELS[data.difficulty] || 'Cơ bản'

  return (
    <div
      onClick={() => data.onClickDetail?.(data)}
      className={`group relative min-w-[180px] max-w-[280px] rounded-xl border bg-white p-3 shadow-sm transition-all cursor-pointer dark:bg-dark-card ${
        data.isHighlighted
          ? 'ring-4 ring-amber-400 border-amber-500 shadow-xl scale-105 z-20'
          : selected
          ? 'ring-2 ring-primary-500 shadow-md border-transparent z-10'
          : 'border-slate-200 hover:border-primary-300 dark:border-dark-border dark:hover:border-slate-600'
      }`}
    >
      {/* 4 Handles cho mạng lưới quan hệ đa hướng */}
      <Handle type="target" position={Position.Top} id="t-top" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Top} id="s-top" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="target" position={Position.Left} id="t-left" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="target" position={Position.Right} id="t-right" className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-2 !h-2 !bg-slate-400" />

      {/* Top Header: Difficulty Badge & Verified */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: diffColor }}
        >
          {diffLabel}
        </span>

        {data.verified === false ? (
          <span
            className="flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
            title="Chưa xác minh — đối chiếu datasheet"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Chưa xác minh</span>
          </span>
        ) : (
          <span className="text-emerald-500" title="Đã xác minh chính xác">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Title */}
      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
        {data.title}
      </div>

      {/* Formula preview */}
      {data.formulaLatex && (
        <div className="mt-1.5 px-2 py-1 bg-slate-50 dark:bg-dark-surface rounded border border-slate-100 dark:border-dark-border/40 text-[11px] overflow-hidden text-ellipsis text-center">
          <KatexMath math={data.formulaLatex} />
        </div>
      )}

      {/* Description Snippet */}
      {data.description && (
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 font-medium"
            >
              #{tag}
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="text-[9px] text-slate-400">+{data.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
})

KnowledgeCustomNode.displayName = 'KnowledgeCustomNode'
