import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import type { Question, QuestionType, Subject, Topic } from '@/types'

interface Props {
  question: Question | null
  subjects: Subject[]
  topics: Topic[]
  onClose: () => void
  onSave: (q: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void
  onDelete?: (id: string) => void
}

export const QuestionModal: React.FC<Props> = ({
  question,
  subjects,
  topics,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEdit = !!question

  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [topicId, setTopicId] = useState<string>('')
  const [type, setType] = useState<QuestionType>('single')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: 'opt-a', text: '' },
    { id: 'opt-b', text: '' },
    { id: 'opt-c', text: '' },
    { id: 'opt-d', text: '' },
  ])
  const [correctAnswer, setCorrectAnswer] = useState<string>('opt-a')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [tagsInput, setTagsInput] = useState('')
  const [source, setSource] = useState('')
  const [year, setYear] = useState<number | undefined>(new Date().getFullYear())

  useEffect(() => {
    if (question) {
      setSubjectId(question.subjectId)
      setTopicId(question.topicId || '')
      setType(question.type)
      setPrompt(question.prompt)
      setOptions(
        question.options && question.options.length > 0
          ? question.options
          : [
              { id: 'opt-a', text: '' },
              { id: 'opt-b', text: '' },
            ]
      )
      setCorrectAnswer(
        Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer
      )
      setExplanation(question.explanation)
      setDifficulty(question.difficulty)
      setTagsInput(question.tags.join(', '))
      setSource(question.source || '')
      setYear(question.year)
    }
  }, [question])

  // Lọc topics theo subject đã chọn
  const filteredTopics = topics.filter(t => t.subjectId === subjectId)

  const handleOptionChange = (id: string, text: string) => {
    setOptions(prev => prev.map(o => (o.id === id ? { ...o, text } : o)))
  }

  const handleAddOption = () => {
    const nextChar = String.fromCharCode(97 + options.length) // a, b, c, d, e...
    setOptions(prev => [...prev, { id: `opt-${nextChar}`, text: '' }])
  }

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter(o => o.id !== id))
    if (correctAnswer === id) {
      setCorrectAnswer(options[0]?.id || '')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !subjectId) return

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload = {
      subjectId,
      topicId: topicId || undefined,
      type,
      prompt: prompt.trim(),
      options: type !== 'numerical' ? options.filter(o => o.text.trim()) : undefined,
      correctAnswer,
      explanation: explanation.trim(),
      difficulty,
      tags,
      source: source.trim() || undefined,
      year: year ? Number(year) : undefined,
    }

    onSave(payload, question?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-border mb-4">
          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
            {isEdit ? 'Chỉnh sửa câu hỏi' : vi.quiz.addQuestion}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Môn & Chủ đề */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.common.subject} *
              </label>
              <select
                className="input text-xs"
                value={subjectId}
                onChange={e => {
                  setSubjectId(e.target.value)
                  setTopicId('')
                }}
                required
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.common.topic}
              </label>
              <select
                className="input text-xs"
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
              >
                <option value="">-- Chưa gắn chủ đề --</option>
                {filteredTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loại câu hỏi & Độ khó */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.quiz.questionType}
              </label>
              <select
                className="input text-xs"
                value={type}
                onChange={e => setType(e.target.value as QuestionType)}
              >
                <option value="single">{vi.quiz.singleChoice}</option>
                <option value="numerical">{vi.quiz.numerical}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.quiz.difficultyLevel}
              </label>
              <select
                className="input text-xs"
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              >
                <option value="1">Mức 1 (Rất dễ - Nhận biết)</option>
                <option value="2">Mức 2 (Dễ - Thông hiểu)</option>
                <option value="3">Mức 3 (Trung bình - Vận dụng)</option>
                <option value="4">Mức 4 (Khó - Vận dụng cao)</option>
                <option value="5">Mức 5 (Rất khó - Chuyên sâu)</option>
              </select>
            </div>
          </div>

          {/* Đề bài (Prompt) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.quiz.questionPrompt} *
            </label>
            <textarea
              className="input resize-none h-20 text-xs"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Nhập nội dung đề bài. Có thể chèn công thức KaTeX bằng cặp dấu $ (vd: $f(x) = x^2$)..."
              required
            />
            {prompt.includes('$') && (
              <div className="mt-1.5 p-2 bg-slate-50 dark:bg-dark-surface rounded border border-slate-200 dark:border-dark-border">
                <div className="text-[10px] text-slate-400 mb-1 font-semibold">Xem trước KaTeX:</div>
                <div className="text-slate-800 dark:text-slate-200">
                  <KatexMath math={prompt} />
                </div>
              </div>
            )}
          </div>

          {/* Các phương án lựa chọn (Trắc nghiệm) */}
          {type !== 'numerical' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {vi.quiz.options} & {vi.quiz.correctAnswer} *
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>{vi.quiz.addOption}</span>
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx) // A, B, C, D
                  const isChecked = correctAnswer === opt.id

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct-opt"
                        checked={isChecked}
                        onChange={() => setCorrectAnswer(opt.id)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        title="Chọn làm đáp án đúng"
                      />
                      <span className="font-bold text-slate-600 dark:text-slate-300 w-4">
                        {letter}.
                      </span>
                      <input
                        type="text"
                        className="input py-1 text-xs flex-1"
                        value={opt.text}
                        onChange={e => handleOptionChange(opt.id, e.target.value)}
                        placeholder={`Phương án ${letter}...`}
                        required
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.quiz.correctAnswer} (Số hoặc chuỗi kết quả) *
              </label>
              <input
                type="text"
                className="input text-xs font-mono"
                value={typeof correctAnswer === 'string' ? correctAnswer : ''}
                onChange={e => setCorrectAnswer(e.target.value)}
                placeholder="Ví dụ: 12.5"
                required
              />
            </div>
          )}

          {/* Lời giải chi tiết (Explanation) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.quiz.explanation} *
            </label>
            <textarea
              className="input resize-none h-20 text-xs"
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Giải thích từng bước, trích dẫn định lý hoặc công thức áp dụng..."
              required
            />
          </div>

          {/* Nguồn đề & Năm thi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.quiz.source}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Đề thi cuối kỳ Bách Khoa, Sách bài tập..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.quiz.year}
              </label>
              <input
                type="number"
                className="input text-xs"
                value={year || ''}
                onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="2023"
              />
            </div>
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
              placeholder="đạo hàm, tiếp tuyến, tích phân..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-dark-border">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(vi.dialog.deleteMessage)) {
                    onDelete(question.id)
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
