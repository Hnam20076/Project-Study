import React, { useState, useEffect, useCallback } from 'react'
import { vi } from '@/i18n/vi'
import { KatexMath } from '@/components/KatexMath'
import { flashcardRepo } from '@/db/repositories'
import {
  X,
  RotateCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import type { Flashcard, SRSReviewRating, Subject } from '@/types'

interface FlashcardStudyRunnerProps {
  cards: Flashcard[]
  subjects: Subject[]
  onClose: () => void
  onComplete: () => void
}

export const FlashcardStudyRunner: React.FC<FlashcardStudyRunnerProps> = ({
  cards,
  subjects,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  const currentCard = cards[currentIndex]
  const subject = subjects.find(s => s.id === currentCard?.subjectId)

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  const handleRate = useCallback(
    async (rating: SRSReviewRating) => {
      if (!currentCard || isReviewing) return
      setIsReviewing(true)
      try {
        await flashcardRepo.reviewCard(currentCard.id, rating)
        setReviewedCount(prev => prev + 1)
        setIsFlipped(false)

        if (currentIndex + 1 < cards.length) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setIsDone(true)
        }
      } finally {
        setIsReviewing(false)
      }
    },
    [currentCard, currentIndex, cards.length, isReviewing]
  )

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return
      if (e.code === 'Space') {
        e.preventDefault()
        handleFlip()
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault()
          handleRate('again')
        } else if (e.key === '2') {
          e.preventDefault()
          handleRate('hard')
        } else if (e.key === '3') {
          e.preventDefault()
          handleRate('good')
        } else if (e.key === '4') {
          e.preventDefault()
          handleRate('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFlip, handleRate, isFlipped, isDone])

  if (isDone || cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border text-center animate-fade-in my-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {vi.quiz.allDone}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Bạn đã ôn tập xong <strong className="text-primary-600">{reviewedCount}</strong> thẻ ghi nhớ với thuật toán lặp lại ngắt quãng SRS.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onComplete}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-md transition-all flex items-center gap-2"
            aria-label={vi.common.close}
          >
            <span>{vi.common.close}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: subject?.color || '#6366f1' }}
          />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {subject?.name || 'Tất cả môn học'}
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-medium">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-muted transition-colors"
          aria-label={vi.common.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-dark-border rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Flashcard 3D Flip Card */}
      <div
        className="w-full min-h-[320px] sm:min-h-[380px] perspective cursor-pointer group"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Lật thẻ ghi nhớ"
      >
        <div
          className={`relative w-full h-full min-h-[320px] sm:min-h-[380px] transition-transform duration-500 transform-style-preserve-3d shadow-xl rounded-2xl border border-slate-200/80 dark:border-dark-border/80 bg-white dark:bg-dark-surface p-6 sm:p-8 flex flex-col justify-between ${
            isFlipped ? 'rotate-y-180 bg-slate-50/50 dark:bg-dark-surface/90' : ''
          }`}
        >
          {/* Card Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isFlipped ? vi.quiz.backSide : vi.quiz.frontSide}</span>
            </div>

            <div className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white leading-relaxed max-w-xl">
              <KatexMath math={isFlipped ? currentCard.back : currentCard.front} />
            </div>

            {isFlipped && currentCard.explanation && (
              <div className="mt-6 p-3 bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-800/30 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-left max-w-lg">
                <span className="font-semibold text-primary-600 dark:text-primary-400 block mb-1">
                  💡 {vi.quiz.explanation}:
                </span>
                <KatexMath math={currentCard.explanation} />
              </div>
            )}
          </div>

          {/* Flip Hint */}
          <div className="pt-4 border-t border-slate-100 dark:border-dark-border/40 text-center">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{vi.quiz.flipCard}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SRS Rating Bar */}
      {isFlipped ? (
        <div className="space-y-2 animate-fade-in">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
            Đánh giá khả năng ghi nhớ của bạn (hoặc nhấn phím 1, 2, 3, 4):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleRate('again')}
              disabled={isReviewing}
              className="p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-300 transition-all text-center group"
              aria-label={vi.quiz.ratingAgain}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                [1] Lại ngay
              </div>
              <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">&lt; 1 ngày</div>
            </button>

            <button
              type="button"
              onClick={() => handleRate('hard')}
              disabled={isReviewing}
              className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-700 dark:text-amber-300 transition-all text-center group"
              aria-label={vi.quiz.ratingHard}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                [2] Khó
              </div>
              <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80">1 - 2 ngày</div>
            </button>

            <button
              type="button"
              onClick={() => handleRate('good')}
              disabled={isReviewing}
              className="p-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800/50 rounded-xl text-sky-700 dark:text-sky-300 transition-all text-center group"
              aria-label={vi.quiz.ratingGood}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                [3] Vừa
              </div>
              <div className="text-[11px] text-sky-600/80 dark:text-sky-400/80">3 - 4 ngày</div>
            </button>

            <button
              type="button"
              onClick={() => handleRate('easy')}
              disabled={isReviewing}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-700 dark:text-emerald-300 transition-all text-center group"
              aria-label={vi.quiz.ratingEasy}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                [4] Dễ
              </div>
              <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">7+ ngày</div>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleFlip}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-md transition-all flex items-center gap-2"
            aria-label={vi.quiz.showAnswer}
          >
            <Sparkles className="w-4 h-4" />
            <span>{vi.quiz.showAnswer} (Space)</span>
          </button>
        </div>
      )}
    </div>
  )
}
