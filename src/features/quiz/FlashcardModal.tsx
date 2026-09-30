import React, { useState, useEffect } from 'react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import { X, Sparkles } from 'lucide-react'
import type { Flashcard, Subject, Topic } from '@/types'

interface FlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  initialData?: Flashcard | null
  subjects: Subject[]
  topics: Topic[]
  defaultSubjectId?: string
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  subjects,
  topics,
  defaultSubjectId,
}) => {
  const [subjectId, setSubjectId] = useState<string>('')
  const [topicId, setTopicId] = useState<string>('')
  const [front, setFront] = useState<string>('')
  const [back, setBack] = useState<string>('')
  const [explanation, setExplanation] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (initialData) {
      setSubjectId(initialData.subjectId)
      setTopicId(initialData.topicId || '')
      setFront(initialData.front)
      setBack(initialData.back)
      setExplanation(initialData.explanation || '')
    } else {
      setSubjectId(defaultSubjectId && defaultSubjectId !== 'all' ? defaultSubjectId : subjects[0]?.id || '')
      setTopicId('')
      setFront('')
      setBack('')
      setExplanation('')
    }
  }, [initialData, defaultSubjectId, subjects, isOpen])

  if (!isOpen) return null

  const filteredTopics = topics.filter(t => t.subjectId === subjectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.trim() || !back.trim() || !subjectId) return

    try {
      setIsSubmitting(true)
      await onSave({
        subjectId,
        topicId: topicId || undefined,
        front: front.trim(),
        back: back.trim(),
        explanation: explanation.trim() || undefined,
        interval: initialData?.interval ?? 0,
        repetition: initialData?.repetition ?? 0,
        easeFactor: initialData?.easeFactor ?? 2.5,
        nextReviewDate: initialData?.nextReviewDate ?? new Date(),
        tags: initialData?.tags || [],
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-surface rounded-xl shadow-2xl border border-slate-200 dark:border-dark-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-border">
          <h2 id="flashcard-modal-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span>{initialData ? vi.quiz.editFlashcard : vi.quiz.addFlashcard}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-muted"
            aria-label={vi.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.className} *
              </label>
              <select
                id="card-subject"
                value={subjectId}
                onChange={e => {
                  setSubjectId(e.target.value)
                  setTopicId('')
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="card-topic" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chủ đề môn học
              </label>
              <select
                id="card-topic"
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">-- Không phân chủ đề --</option>
                {filteredTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mặt trước */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="card-front" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {vi.quiz.frontSide} *
              </label>
              <span className="text-[10px] text-slate-400">Hỗ trợ KaTeX: $...$ hoặc $$...$$</span>
            </div>
            <textarea
              id="card-front"
              rows={3}
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="Ví dụ: Công thức tính năng lượng $E = mc^2$ của ai?"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
            {front && (
              <div className="mt-1 p-2 bg-slate-50 dark:bg-dark-bg/60 rounded border border-slate-200 dark:border-dark-border text-xs">
                <span className="text-[10px] text-slate-400 block mb-0.5">Xem trước mặt trước:</span>
                <KatexMath math={front} className="text-slate-800 dark:text-slate-200" />
              </div>
            )}
          </div>

          {/* Mặt sau */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="card-back" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {vi.quiz.backSide} *
              </label>
              <span className="text-[10px] text-slate-400">Hỗ trợ KaTeX: $...$ hoặc $$...$$</span>
            </div>
            <textarea
              id="card-back"
              rows={3}
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="Ví dụ: Albert Einstein"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
            {back && (
              <div className="mt-1 p-2 bg-slate-50 dark:bg-dark-bg/60 rounded border border-slate-200 dark:border-dark-border text-xs">
                <span className="text-[10px] text-slate-400 block mb-0.5">Xem trước mặt sau:</span>
                <KatexMath math={back} className="text-slate-800 dark:text-slate-200 font-medium" />
              </div>
            )}
          </div>

          {/* Giải thích thêm */}
          <div>
            <label htmlFor="card-explanation" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {vi.quiz.cardExplanation}
            </label>
            <textarea
              id="card-explanation"
              rows={2}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Ghi chú thêm giúp ghi nhớ tốt hơn..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-muted rounded-lg transition-colors"
              aria-label={vi.common.cancel}
            >
              {vi.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !front.trim() || !back.trim() || !subjectId}
              className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              aria-label={vi.common.save}
            >
              {isSubmitting ? vi.common.loading : vi.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
