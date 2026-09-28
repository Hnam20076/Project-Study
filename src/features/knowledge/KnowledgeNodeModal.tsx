import React, { useState, useEffect } from 'react'
import { X, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import { DIFFICULTY_LABELS, type KnowledgeNode, type KnowledgeDifficulty, type Subject } from '@/types'

interface Props {
  node: KnowledgeNode | null
  subjects: Subject[]
  onClose: () => void
  onSave: (nodeData: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void
  onDelete?: (id: string) => void
}

export const KnowledgeNodeModal: React.FC<Props> = ({
  node,
  subjects,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEdit = !!node

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formulaLatex, setFormulaLatex] = useState('')
  const [examples, setExamples] = useState('')
  const [references, setReferences] = useState('')
  const [difficulty, setDifficulty] = useState<KnowledgeDifficulty>(1)
  const [tagsInput, setTagsInput] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [verified, setVerified] = useState(true)
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setDescription(node.description)
      setFormulaLatex(node.formulaLatex || '')
      setExamples(node.examples || '')
      setReferences(node.references || '')
      setDifficulty(node.difficulty)
      setTagsInput(node.tags.join(', '))
      setSource(node.source || '')
      setSourceUrl(node.sourceUrl || '')
      setVerified(node.verified ?? true)
      setSubjectId(node.subjectId)
    } else {
      setTitle('')
      setDescription('')
      setFormulaLatex('')
      setExamples('')
      setReferences('')
      setDifficulty(1)
      setTagsInput('')
      setSource('')
      setSourceUrl('')
      setVerified(true)
      setSubjectId(undefined)
    }
  }, [node])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      formulaLatex: formulaLatex.trim() || undefined,
      examples: examples.trim() || undefined,
      references: references.trim() || undefined,
      difficulty,
      tags,
      source: source.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      verified,
      subjectId: subjectId || undefined,
      x: node?.x ?? (Math.random() * 400 + 100),
      y: node?.y ?? (Math.random() * 400 + 100),
    }

    onSave(payload, node?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-4">
          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
            {isEdit ? vi.knowledge.editNode : vi.knowledge.newNode}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.nodeTitle} *
            </label>
            <input
              type="text"
              autoFocus
              className="input text-xs"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Định luật Faraday..."
              required
            />
          </div>

          {/* Subject & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.common.subject}
              </label>
              <select
                className="input text-xs"
                value={subjectId || ''}
                onChange={e => setSubjectId(e.target.value || undefined)}
              >
                <option value="">-- Không phân môn --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.knowledge.difficulty} (1-5)
              </label>
              <select
                className="input text-xs"
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value) as KnowledgeDifficulty)}
              >
                {([1, 2, 3, 4, 5] as KnowledgeDifficulty[]).map(d => (
                  <option key={d} value={d}>
                    Mức {d} - {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.description} *
            </label>
            <textarea
              className="input resize-none h-20 text-xs"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Định nghĩa bản chất, nguyên lý, hoặc ý nghĩa kiến thức..."
              required
            />
          </div>

          {/* KaTeX Formula */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.formula}
            </label>
            <input
              type="text"
              className="input font-mono text-xs"
              value={formulaLatex}
              onChange={e => setFormulaLatex(e.target.value)}
              placeholder="Ví dụ: \mathcal{E} = - \frac{d\Phi_B}{dt}"
            />
            {formulaLatex && (
              <div className="mt-1.5 p-2 bg-slate-50 dark:bg-dark-surface rounded border border-slate-200 dark:border-dark-border text-center">
                <KatexMath math={formulaLatex} block />
              </div>
            )}
          </div>

          {/* Examples */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.examples}
            </label>
            <textarea
              className="input resize-none h-16 text-xs"
              value={examples}
              onChange={e => setExamples(e.target.value)}
              placeholder="Ví dụ tính toán, thí nghiệm minh họa..."
            />
          </div>

          {/* References & Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.knowledge.source}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Giáo trình, sách, tài liệu chuẩn"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.knowledge.sourceUrl}
              </label>
              <input
                type="url"
                className="input text-xs"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* References Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.knowledge.references}
            </label>
            <input
              type="text"
              className="input text-xs"
              value={references}
              onChange={e => setReferences(e.target.value)}
              placeholder="Trang sách, chương, mục..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.common.tags} (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              className="input text-xs"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="điện từ, cảm ứng, vật lý đại cương..."
            />
          </div>

          {/* Verified Checkbox & Rule Note */}
          <div className="p-3 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={e => setVerified(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {vi.knowledge.verified}
              </span>
            </label>

            {!verified && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  {vi.knowledge.unverifiedBadge} — {vi.knowledge.unverifiedNotice}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-dark-border">
            {isEdit && onDelete ? (
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
