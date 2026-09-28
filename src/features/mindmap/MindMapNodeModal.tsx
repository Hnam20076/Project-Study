import React, { useState, useEffect } from 'react'
import { X, Trash2, Plus, Check } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import type { MindMapNodeData } from '@/types'

const PRESET_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#14b8a6',
]

interface Props {
  node: MindMapNodeData | null
  onClose: () => void
  onSave: (updated: MindMapNodeData) => void
  onDelete?: (id: string) => void
}

export const MindMapNodeModal: React.FC<Props> = ({ node, onClose, onSave, onDelete }) => {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [notes, setNotes] = useState('')
  const [formulaLatex, setFormulaLatex] = useState('')
  const [checkItems, setCheckItems] = useState<{ id: string; text: string; checked: boolean }[]>([])
  const [newCheckText, setNewCheckText] = useState('')

  useEffect(() => {
    if (node) {
      setLabel(node.label || '')
      setColor(node.color || '#6366f1')
      setNotes(node.notes || '')
      setFormulaLatex(node.formulaLatex || '')
      setCheckItems(node.checkItems ? [...node.checkItems] : [])
    }
  }, [node])

  if (!node) return null

  const handleAddCheck = () => {
    if (!newCheckText.trim()) return
    setCheckItems(prev => [
      ...prev,
      { id: `c-${Date.now()}`, text: newCheckText.trim(), checked: false },
    ])
    setNewCheckText('')
  }

  const handleToggleCheck = (id: string) => {
    setCheckItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    )
  }

  const handleDeleteCheck = (id: string) => {
    setCheckItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    onSave({
      ...node,
      label: label.trim(),
      color,
      notes: notes.trim() || undefined,
      formulaLatex: formulaLatex.trim() || undefined,
      checkItems: checkItems.length > 0 ? checkItems : undefined,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-4">
          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
            {vi.mindmap.editNode}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {vi.mindmap.nodeLabel} *
            </label>
            <input
              type="text"
              autoFocus
              className="input"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Tiêu đề node..."
              required
            />
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {vi.mindmap.changeColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* KaTeX Formula */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {vi.mindmap.nodeFormula}
            </label>
            <input
              type="text"
              className="input font-mono text-xs"
              value={formulaLatex}
              onChange={e => setFormulaLatex(e.target.value)}
              placeholder="Ví dụ: f'(x) = 2x + 1"
            />
            {formulaLatex && (
              <div className="mt-1.5 p-2 bg-slate-50 dark:bg-dark-surface rounded border border-slate-200 dark:border-dark-border text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">Xem trước:</div>
                <KatexMath math={formulaLatex} block />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {vi.mindmap.nodeNotes}
            </label>
            <textarea
              className="input resize-none h-16 text-xs"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú mở rộng..."
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {vi.mindmap.nodeChecklist}
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2 pr-1">
              {checkItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-xs"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleCheck(item.id)}
                    className="w-3.5 h-3.5 rounded text-primary-600"
                  />
                  <span
                    className={`flex-1 truncate ${
                      item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCheck(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                className="input text-xs flex-1"
                placeholder={vi.mindmap.addCheckItem}
                value={newCheckText}
                onChange={e => setNewCheckText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCheck()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCheck}
                className="btn-secondary px-2 py-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-dark-border">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(vi.dialog.deleteMessage)) {
                    onDelete(node.id)
                    onClose()
                  }
                }}
                className="btn-ghost text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {vi.common.delete}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                {vi.common.cancel}
              </button>
              <button type="submit" className="btn-primary text-xs">
                {vi.common.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
