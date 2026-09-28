import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KatexMath } from '@/components/KatexMath'
import { CheckSquare, FileText, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import type { MindMapNodeData } from '@/types'

export interface MindMapNodeCustomData extends MindMapNodeData {
  hasChildren?: boolean
  childCount?: number
  onToggleCollapse?: (id: string) => void
  onAddChild?: (id: string) => void
  onEdit?: (node: MindMapNodeData) => void
}

export const MindMapCustomNode: React.FC<NodeProps> = memo(({ id, data: rawData, selected }) => {
  const data = rawData as unknown as MindMapNodeCustomData

  const totalChecks = data.checkItems?.length || 0
  const doneChecks = data.checkItems?.filter(c => c.checked).length || 0

  return (
    <div
      className={`group relative min-w-[150px] max-w-[280px] rounded-xl border bg-white p-3 shadow-sm transition-all dark:bg-dark-card ${
        selected
          ? 'ring-2 ring-primary-500 shadow-md border-transparent'
          : 'border-slate-200 hover:border-slate-300 dark:border-dark-border dark:hover:border-slate-600'
      }`}
      style={{
        borderLeftWidth: '6px',
        borderLeftColor: data.color || '#6366f1',
      }}
      onDoubleClick={e => {
        e.stopPropagation()
        data.onEdit?.(data)
      }}
    >
      {/* Target handle (bên trái) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white dark:!border-dark-card"
      />

      {/* Header: Label */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 leading-snug break-words">
          {data.label || 'Node'}
        </span>

        {/* Nút thêm nhanh node con */}
        <button
          onClick={e => {
            e.stopPropagation()
            data.onAddChild?.(id)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400 hover:text-primary-600"
          title="Thêm node con (Tab)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KaTeX formula preview */}
      {data.formulaLatex && (
        <div className="mt-1.5 px-1.5 py-0.5 bg-slate-50 dark:bg-dark-surface rounded border border-slate-100 dark:border-dark-border/40 text-[11px] overflow-hidden text-ellipsis">
          <KatexMath math={data.formulaLatex} />
        </div>
      )}

      {/* Notes preview */}
      {data.notes && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
          <FileText className="w-3 h-3 flex-shrink-0 opacity-70" />
          <span className="truncate">{data.notes}</span>
        </div>
      )}

      {/* Checklist counter */}
      {totalChecks > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <CheckSquare className="w-3 h-3 text-emerald-500" />
          <span>
            {doneChecks}/{totalChecks} việc
          </span>
          <div className="flex-1 bg-slate-200 dark:bg-dark-border h-1.5 rounded-full overflow-hidden ml-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${(doneChecks / totalChecks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Collapse/Expand button */}
      {data.hasChildren && (
        <button
          onClick={e => {
            e.stopPropagation()
            data.onToggleCollapse?.(id)
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-dark-card border border-slate-300 dark:border-dark-border flex items-center justify-center text-[10px] shadow-sm hover:scale-110 transition-transform z-10"
          title={data.collapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
        >
          {data.collapsed ? (
            <ChevronRight className="w-3 h-3 text-primary-600" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          )}
        </button>
      )}

      {/* Source handle (bên phải) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-primary-500 !border-2 !border-white dark:!border-dark-card"
      />
    </div>
  )
})

MindMapCustomNode.displayName = 'MindMapCustomNode'
