import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { formulaRepo, calcHistoryRepo } from '@/db/repositories'
import { FormulaModal } from './FormulaModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { KatexMath } from '@/components/KatexMath'
import { vi } from '@/i18n/vi'
import { evaluate, format } from 'mathjs'
import {
  Calculator as CalcIcon,
  Search,
  Plus,
  Play,
  History,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Formula, FormulaCategory } from '@/types'

export const CalculatorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'formulas' | 'scientific'>('formulas')

  const formulas = useLiveQuery(() => formulaRepo.getAll(), []) ?? []
  const history = useLiveQuery(() => calcHistoryRepo.getRecent(20), []) ?? []

  // === Formula Library State ===
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FormulaCategory | 'all'>('all')
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null)
  const [variableInputs, setVariableInputs] = useState<Record<string, number>>({})
  const [calculatedResult, setCalculatedResult] = useState<number | string | null>(null)
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null)
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false)

  // Mặc định chọn công thức đầu tiên
  useEffect(() => {
    if (formulas.length > 0 && !selectedFormulaId) {
      setSelectedFormulaId(formulas[0].id)
    }
  }, [formulas, selectedFormulaId])

  const selectedFormula = useMemo(() => {
    return formulas.find(f => f.id === selectedFormulaId) || null
  }, [formulas, selectedFormulaId])

  // Khởi tạo các giá trị biến khi đổi công thức
  useEffect(() => {
    if (selectedFormula) {
      const initial: Record<string, number> = {}
      selectedFormula.variables.forEach(v => {
        initial[v.symbol] = v.defaultValue ?? 0
      })
      setVariableInputs(initial)
      setCalculatedResult(null)
    }
  }, [selectedFormula])

  // Tính toán kết quả cho công thức
  const handleCalculateFormula = () => {
    if (!selectedFormula) return
    try {
      // Đánh giá biểu thức bằng mathjs với scope là các biến đầu vào
      const res = evaluate(selectedFormula.expression, variableInputs)
      const formatted = typeof res === 'number' ? Number(res.toFixed(4)) : String(res)
      setCalculatedResult(formatted)
      toast.success(vi.toast.saved)
    } catch (err) {
      console.error(err)
      toast.error(vi.calculator.invalidExpression)
    }
  }

  // === Scientific Calculator State ===
  const [calcInput, setCalcInput] = useState('')
  const [calcResult, setCalcResult] = useState('')

  const handleCalcButtonClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('')
      setCalcResult('')
    } else if (val === 'DEL') {
      setCalcInput(prev => prev.slice(0, -1))
    } else if (val === '=') {
      if (!calcInput.trim()) return
      try {
        const evaluated = evaluate(calcInput)
        const formatted = format(evaluated, { precision: 10 })
        setCalcResult(formatted)
        calcHistoryRepo.add(calcInput, formatted)
      } catch (err) {
        setCalcResult('Lỗi cú pháp')
      }
    } else {
      setCalcInput(prev => prev + val)
    }
  }

  // Lọc danh sách công thức
  const filteredFormulas = useMemo(() => {
    return formulas.filter(f => {
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = f.name.toLowerCase().includes(q)
        const matchDesc = f.description.toLowerCase().includes(q)
        const matchTag = f.tags.some(t => t.toLowerCase().includes(q))
        if (!matchName && !matchDesc && !matchTag) return false
      }
      return true
    })
  }, [formulas, selectedCategory, searchQuery])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Top Header & Tab Navigation */}
      <header className="px-4 py-2.5 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <CalcIcon className="w-5 h-5 flex-shrink-0" />
          <h1 className="font-bold text-base text-slate-800 dark:text-slate-100 hidden sm:inline">
            {vi.calculator.title}
          </h1>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-dark-muted p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('formulas')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'formulas'
                ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {vi.calculator.formulaLibrary}
          </button>
          <button
            onClick={() => setActiveTab('scientific')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'scientific'
                ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {vi.calculator.scientificCalc}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
        {/* === TAB 1: THƯ VIỆN CÔNG THỨC & GIẢI TỪNG BƯỚC === */}
        {activeTab === 'formulas' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Sidebar danh sách công thức */}
            <div className="md:col-span-1 space-y-3">
              {/* Search & Actions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={vi.calculator.searchFormula}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input pl-8 py-1.5 text-xs w-full"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingFormula(null)
                    setIsFormulaModalOpen(true)
                  }}
                  className="btn-primary p-2 text-xs"
                  title={vi.calculator.addFormula}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    selectedCategory === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-dark-card text-slate-600 border border-slate-200 dark:border-dark-border'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setSelectedCategory('electronics')}
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    selectedCategory === 'electronics'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-dark-card text-slate-600 border border-slate-200 dark:border-dark-border'
                  }`}
                >
                  {vi.calculator.electronics}
                </button>
                <button
                  onClick={() => setSelectedCategory('physics')}
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    selectedCategory === 'physics'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-dark-card text-slate-600 border border-slate-200 dark:border-dark-border'
                  }`}
                >
                  {vi.calculator.physics}
                </button>
                <button
                  onClick={() => setSelectedCategory('math')}
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    selectedCategory === 'math'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-dark-card text-slate-600 border border-slate-200 dark:border-dark-border'
                  }`}
                >
                  {vi.calculator.math}
                </button>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredFormulas.map(f => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFormulaId(f.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      f.id === selectedFormulaId
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {f.name}
                      </span>
                      {f.isDemo && (
                        <span className="badge-demo text-[9px]">{vi.demo.badge}</span>
                      )}
                    </div>
                    <div className="py-1 overflow-x-auto text-slate-700 dark:text-slate-300">
                      <KatexMath math={f.latex} />
                    </div>
                  </div>
                ))}

                {filteredFormulas.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {vi.calculator.noFormulas}
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết giải công thức tương tác */}
            <div className="md:col-span-2 space-y-4">
              {selectedFormula ? (
                <div className="card p-6 space-y-5">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-dark-border pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {selectedFormula.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedFormula.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingFormula(selectedFormula)
                          setIsFormulaModalOpen(true)
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded"
                        title={vi.common.edit}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(vi.dialog.deleteMessage)) {
                            await formulaRepo.delete(selectedFormula.id)
                            toast.success(vi.toast.deleted)
                            setSelectedFormulaId(null)
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                        title={vi.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Formula KaTeX big display */}
                  <div className="p-4 bg-slate-50 dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border text-center">
                    <KatexMath math={selectedFormula.latex} block />
                  </div>

                  {/* Inputs for variables */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {vi.calculator.inputVariables}:
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedFormula.variables.map(v => (
                        <div key={v.symbol} className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                              {v.symbol} ({v.name}):
                            </span>
                            <span className="text-slate-400 text-[10px]">{v.unit}</span>
                          </div>
                          <input
                            type="number"
                            step="any"
                            className="input py-1 text-xs font-mono w-full"
                            value={variableInputs[v.symbol] ?? ''}
                            onChange={e =>
                              setVariableInputs(prev => ({
                                ...prev,
                                [v.symbol]: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleCalculateFormula}
                      className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-md mt-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{vi.calculator.calculate}</span>
                    </button>
                  </div>

                  {/* Calculated Result Display */}
                  {calculatedResult !== null && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-1 animate-scale-up">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {vi.calculator.result}:
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {selectedFormula.resultSymbol} = {calculatedResult} {selectedFormula.resultUnit}
                      </div>
                    </div>
                  )}

                  {/* Step-by-step breakdown */}
                  {selectedFormula.stepsExplanation && selectedFormula.stepsExplanation.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-2 text-xs">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{vi.calculator.stepByStep}</span>
                      </h4>
                      <ol className="space-y-1.5 list-decimal list-inside text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedFormula.stepsExplanation.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-12 text-center text-slate-400 text-xs">
                  Chọn một công thức từ thư viện bên trái để bắt đầu tính toán
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB 2: MÁY TÍNH KHOA HỌC (SCIENTIFIC CALCULATOR PAD) === */}
        {activeTab === 'scientific' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Calculator Pad */}
            <div className="md:col-span-2 card p-5 space-y-4">
              {/* Display screen */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-right space-y-1 shadow-inner">
                <input
                  type="text"
                  readOnly
                  value={calcInput}
                  placeholder="0"
                  className="w-full bg-transparent text-right text-lg text-slate-300 font-mono focus:outline-none"
                />
                <div className="text-2xl font-bold text-emerald-400 min-h-[32px] truncate">
                  {calcResult ? `= ${calcResult}` : ''}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-5 gap-2 text-xs font-semibold">
                {/* Scientific Functions */}
                {['sin(', 'cos(', 'tan(', 'sqrt(', '^'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-border text-primary-600 dark:text-primary-400 transition-colors"
                  >
                    {btn.replace('(', '')}
                  </button>
                ))}

                {['log(', 'ln(', '(', ')', 'pi'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn === 'ln(' ? 'log(' : btn)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-border text-primary-600 dark:text-primary-400 transition-colors"
                  >
                    {btn.replace('(', '')}
                  </button>
                ))}

                {/* Numbers & basic operations */}
                {['7', '8', '9', '/', 'DEL'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn)}
                    className={`p-3 rounded-xl transition-colors ${
                      btn === 'DEL'
                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                        : btn === '/'
                        ? 'bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-slate-100'
                        : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {btn}
                  </button>
                ))}

                {['4', '5', '6', '*', 'C'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn)}
                    className={`p-3 rounded-xl transition-colors ${
                      btn === 'C'
                        ? 'bg-slate-200 dark:bg-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        : btn === '*'
                        ? 'bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-slate-100'
                        : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {btn === '*' ? '×' : btn}
                  </button>
                ))}

                {['1', '2', '3', '-', 'e'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn)}
                    className={`p-3 rounded-xl transition-colors ${
                      btn === '-' || btn === 'e'
                        ? 'bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-slate-100'
                        : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {btn}
                  </button>
                ))}

                {['0', '.', '%', '+', '='].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButtonClick(btn)}
                    className={`p-3 rounded-xl transition-colors ${
                      btn === '='
                        ? 'bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md'
                        : btn === '+'
                        ? 'bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-slate-100'
                        : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation History */}
            <div className="card p-4 space-y-3 h-fit text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <History className="w-4 h-4 text-primary-500" />
                  <span>{vi.calculator.calcHistory}</span>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={() => calcHistoryRepo.clear()}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title={vi.calculator.clearHistory}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCalcInput(item.expression)
                      setCalcResult(item.result)
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-muted cursor-pointer transition-colors space-y-0.5"
                  >
                    <div className="font-mono text-slate-600 dark:text-slate-400 truncate">
                      {item.expression}
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      = {item.result}
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-[11px]">
                    Chưa có lịch sử bấm máy
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formula Modal */}
      {isFormulaModalOpen && (
        <FormulaModal
          formula={editingFormula}
          onClose={() => {
            setIsFormulaModalOpen(false)
            setEditingFormula(null)
          }}
          onSave={async (fData, id) => {
            if (id) {
              await formulaRepo.update(id, fData)
              toast.success(vi.toast.updated)
            } else {
              await formulaRepo.create(fData)
              toast.success(vi.toast.created)
            }
          }}
          onDelete={async id => {
            await formulaRepo.delete(id)
            toast.success(vi.toast.deleted)
          }}
        />
      )}
    </div>
  )
}

export const CalculatorPage: React.FC = () => {
  return (
    <ErrorBoundary moduleName={vi.nav.calculator}>
      <CalculatorContent />
    </ErrorBoundary>
  )
}
