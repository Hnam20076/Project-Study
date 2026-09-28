import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import type { Formula, FormulaCategory, FormulaVariable } from '@/types'

interface Props {
  formula: Formula | null
  onClose: () => void
  onSave: (f: Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void
  onDelete?: (id: string) => void
}

export const FormulaModal: React.FC<Props> = ({
  formula,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEdit = !!formula

  const [name, setName] = useState('')
  const [category, setCategory] = useState<FormulaCategory>('custom')
  const [latex, setLatex] = useState('')
  const [description, setDescription] = useState('')
  const [expression, setExpression] = useState('')
  const [resultSymbol, setResultSymbol] = useState('')
  const [resultUnit, setResultUnit] = useState('')
  const [variables, setVariables] = useState<FormulaVariable[]>([
    { symbol: 'x', name: 'Biến x', unit: '', defaultValue: 0 },
  ])
  const [stepsInput, setStepsInput] = useState('')

  useEffect(() => {
    if (formula) {
      setName(formula.name)
      setCategory(formula.category)
      setLatex(formula.latex)
      setDescription(formula.description)
      setExpression(formula.expression)
      setResultSymbol(formula.resultSymbol)
      setResultUnit(formula.resultUnit)
      setVariables(formula.variables || [])
      setStepsInput(formula.stepsExplanation?.join('\n') || '')
    }
  }, [formula])

  const handleAddVariable = () => {
    setVariables(prev => [
      ...prev,
      { symbol: `var${prev.length + 1}`, name: 'Biến mới', unit: '', defaultValue: 0 },
    ])
  }

  const handleUpdateVariable = (idx: number, patch: Partial<FormulaVariable>) => {
    setVariables(prev => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  }

  const handleRemoveVariable = (idx: number) => {
    if (variables.length <= 1) return
    setVariables(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !latex.trim() || !expression.trim()) return

    const steps = stepsInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      name: name.trim(),
      category,
      latex: latex.trim(),
      description: description.trim(),
      expression: expression.trim(),
      resultSymbol: resultSymbol.trim() || 'Result',
      resultUnit: resultUnit.trim(),
      variables,
      stepsExplanation: steps.length > 0 ? steps : undefined,
      tags: [category],
    }

    onSave(payload, formula?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-4">
          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
            {isEdit ? 'Chỉnh sửa công thức' : vi.calculator.addFormula}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tên & Phân loại */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.calculator.formulaName} *
              </label>
              <input
                type="text"
                className="input text-xs"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Định luật Coulomb..."
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.calculator.category}
              </label>
              <select
                className="input text-xs"
                value={category}
                onChange={e => setCategory(e.target.value as FormulaCategory)}
              >
                <option value="math">{vi.calculator.math}</option>
                <option value="physics">{vi.calculator.physics}</option>
                <option value="electronics">{vi.calculator.electronics}</option>
                <option value="custom">{vi.calculator.custom}</option>
              </select>
            </div>
          </div>

          {/* Biểu thức KaTeX */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.calculator.formulaLatex} *
            </label>
            <input
              type="text"
              className="input font-mono text-xs"
              value={latex}
              onChange={e => setLatex(e.target.value)}
              placeholder="F = k \cdot \frac{|q_1 q_2|}{r^2}"
              required
            />
            {latex && (
              <div className="mt-1.5 p-2 bg-slate-50 dark:bg-dark-surface rounded border border-slate-200 dark:border-dark-border text-center">
                <KatexMath math={latex} block />
              </div>
            )}
          </div>

          {/* Biểu thức tính toán mathjs */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.calculator.formulaExpression} (dùng mathjs) *
            </label>
            <input
              type="text"
              className="input font-mono text-xs"
              value={expression}
              onChange={e => setExpression(e.target.value)}
              placeholder="k * abs(q1 * q2) / (r^2)"
              required
            />
            <span className="text-[10px] text-slate-400">
              Sử dụng các toán tử: +, -, *, /, ^, sqrt(), abs(), pi, e...
            </span>
          </div>

          {/* Ký hiệu & Đơn vị kết quả */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.calculator.resultSymbol}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={resultSymbol}
                onChange={e => setResultSymbol(e.target.value)}
                placeholder="F"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.calculator.resultUnit}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={resultUnit}
                onChange={e => setResultUnit(e.target.value)}
                placeholder="N (Newton)"
              />
            </div>
          </div>

          {/* Danh sách biến đầu vào */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {vi.calculator.inputVariables}
              </label>
              <button
                type="button"
                onClick={handleAddVariable}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm biến</span>
              </button>
            </div>

            <div className="space-y-2">
              {variables.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
                  <input
                    type="text"
                    className="input py-1 text-xs w-16 font-mono"
                    value={v.symbol}
                    onChange={e => handleUpdateVariable(idx, { symbol: e.target.value })}
                    placeholder="Ký hiệu"
                    required
                  />
                  <input
                    type="text"
                    className="input py-1 text-xs flex-1"
                    value={v.name}
                    onChange={e => handleUpdateVariable(idx, { name: e.target.value })}
                    placeholder="Tên biến"
                  />
                  <input
                    type="text"
                    className="input py-1 text-xs w-20"
                    value={v.unit}
                    onChange={e => handleUpdateVariable(idx, { unit: e.target.value })}
                    placeholder="Đơn vị"
                  />
                  {variables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.calculator.formulaDescription}
            </label>
            <textarea
              className="input resize-none h-16 text-xs"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Giải thích nguyên lý và ý nghĩa vật lý/toán học..."
            />
          </div>

          {/* Các bước giải từng bước */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.calculator.stepByStep} (mỗi dòng một bước)
            </label>
            <textarea
              className="input resize-none h-20 text-xs"
              value={stepsInput}
              onChange={e => setStepsInput(e.target.value)}
              placeholder="Bước 1: Xác định giá trị...&#10;Bước 2: Thay số vào biểu thức...&#10;Bước 3: Kết luận đơn vị..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-dark-border">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(vi.dialog.deleteMessage)) {
                    onDelete(formula.id)
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
