import React, { useState, useMemo } from 'react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import { FlashcardModal } from './FlashcardModal'
import { FlashcardStudyRunner } from './FlashcardStudyRunner'
import { flashcardRepo } from '@/db/repositories'
import { isCardDue } from '@/services/srsAlgorithm'
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Flashcard, Subject, Topic, Question } from '@/types'

interface FlashcardTabProps {
  flashcards: Flashcard[]
  subjects: Subject[]
  topics: Topic[]
  questions: Question[]
  selectedSubjectId: string
  onSelectSubjectId: (id: string) => void
}

export const FlashcardTab: React.FC<FlashcardTabProps> = ({
  flashcards,
  subjects,
  topics,
  questions,
  selectedSubjectId,
  onSelectSubjectId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [isStudying, setIsStudying] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Lọc thẻ theo môn học được chọn
  const filteredCards = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === 'all') return flashcards
    return flashcards.filter(c => c.subjectId === selectedSubjectId)
  }, [flashcards, selectedSubjectId])

  // Thống kê
  const dueCards = useMemo(() => {
    return filteredCards.filter(c => isCardDue(c))
  }, [filteredCards])

  const newCardsCount = useMemo(() => {
    return filteredCards.filter(c => c.repetition === 0).length
  }, [filteredCards])

  // Xử lý tạo thẻ từ câu hỏi trắc nghiệm
  const handleConvertFromQuestions = async () => {
    const candidateQuestions = selectedSubjectId === 'all'
      ? questions
      : questions.filter(q => q.subjectId === selectedSubjectId)

    if (candidateQuestions.length === 0) {
      toast.warning('Không có câu hỏi nào để tạo thẻ!')
      return
    }

    try {
      setIsConverting(true)
      const existingQuestionIds = new Set(flashcards.map(c => c.questionId).filter(Boolean))
      let createdCount = 0

      for (const q of candidateQuestions) {
        if (!existingQuestionIds.has(q.id)) {
          await flashcardRepo.createFromQuestion(q)
          createdCount++
        }
      }

      if (createdCount > 0) {
        toast.success(`Đã tạo thành công ${createdCount} thẻ ghi nhớ từ ngân hàng câu hỏi!`)
      } else {
        toast.info('Tất cả câu hỏi này đã được tạo thẻ ghi nhớ từ trước!')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo thẻ!')
    } finally {
      setIsConverting(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (confirm(vi.dialog.deleteMessage)) {
      await flashcardRepo.delete(id)
      toast.success('Đã xóa thẻ ghi nhớ!')
    }
  }

  const handleSaveCard = async (data: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCard) {
      await flashcardRepo.update(editingCard.id, data)
      toast.success('Đã cập nhật thẻ ghi nhớ!')
    } else {
      await flashcardRepo.create(data)
      toast.success('Đã thêm thẻ ghi nhớ mới!')
    }
    setEditingCard(null)
  }

  // Chế độ học tập
  if (isStudying) {
    const studyCards = dueCards.length > 0 ? dueCards : filteredCards
    return (
      <FlashcardStudyRunner
        cards={studyCards}
        subjects={subjects}
        onClose={() => setIsStudying(false)}
        onComplete={() => setIsStudying(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card: Due today */}
        <div className="p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {vi.quiz.dueToday}
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {dueCards.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card: New cards */}
        <div className="p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {vi.quiz.newCards}
            </div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {newCardsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Card: Total */}
        <div className="p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-slate-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {vi.quiz.totalCards}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {filteredCards.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
        {/* Bộ lọc môn học */}
        <div className="flex items-center gap-2">
          <label htmlFor="filter-subject" className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {vi.schedule.className}:
          </label>
          <select
            id="filter-subject"
            value={selectedSubjectId}
            onChange={e => onSelectSubjectId(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tất cả môn học ({flashcards.length})</option>
            {subjects.map(s => {
              const count = flashcards.filter(c => c.subjectId === s.id).length
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count})
                </option>
              )
            })}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConvertFromQuestions}
            disabled={isConverting}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-dark-muted hover:bg-slate-200 dark:hover:bg-dark-border rounded-lg transition-colors flex items-center gap-1.5"
            aria-label={vi.quiz.createFromQuestions}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isConverting ? 'Đang tạo...' : vi.quiz.createFromQuestions}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCard(null)
              setIsModalOpen(true)
            }}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-dark-muted hover:bg-slate-200 dark:hover:bg-dark-border rounded-lg transition-colors flex items-center gap-1.5"
            aria-label={vi.quiz.addFlashcard}
          >
            <Plus className="w-4 h-4 text-primary-500" />
            <span>{vi.quiz.addFlashcard}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStudying(true)}
            disabled={filteredCards.length === 0}
            className="px-4 py-1.5 text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={vi.quiz.startReview}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {vi.quiz.startReview} {dueCards.length > 0 ? `(${dueCards.length})` : `(${filteredCards.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto text-slate-600 dark:text-slate-400 text-sm">
            {vi.quiz.noFlashcards}
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleConvertFromQuestions}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              aria-label={vi.quiz.createFromQuestions}
            >
              <Sparkles className="w-4 h-4" />
              <span>{vi.quiz.createFromQuestions}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => {
            const subject = subjects.find(s => s.id === card.subjectId)
            const topic = topics.find(t => t.id === card.topicId)
            const due = isCardDue(card)
            const reviewDateStr = new Date(card.nextReviewDate).toLocaleDateString('vi-VN')

            return (
              <div
                key={card.id}
                className={`p-4 rounded-xl border transition-all bg-white dark:bg-dark-surface flex flex-col justify-between ${
                  due
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200 dark:ring-rose-950'
                    : 'border-slate-200 dark:border-dark-border hover:shadow-md'
                }`}
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${subject?.color || '#6366f1'}20`,
                        color: subject?.color || '#6366f1',
                      }}
                    >
                      {subject?.name || 'Môn học'}
                    </span>
                    {due ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse">
                        Cần ôn ngay
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Ôn: {reviewDateStr}
                      </span>
                    )}
                  </div>

                  {topic && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 truncate">
                      📌 {topic.name}
                    </div>
                  )}

                  {/* Front */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2 line-clamp-3">
                    <KatexMath math={card.front} />
                  </div>

                  {/* Back */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 p-2 bg-slate-50 dark:bg-dark-bg/60 rounded-lg line-clamp-2 border border-slate-100 dark:border-dark-border/40">
                    <KatexMath math={card.back} />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Lặp: <strong>{card.repetition}</strong></span>
                    <span>Khoảng cách: <strong>{card.interval}d</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCard(card)
                        setIsModalOpen(true)
                      }}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      aria-label={vi.common.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label={vi.common.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal thêm/sửa Flashcard */}
      <FlashcardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCard(null)
        }}
        onSave={handleSaveCard}
        initialData={editingCard}
        subjects={subjects}
        topics={topics}
        defaultSubjectId={selectedSubjectId}
      />
    </div>
  )
}
