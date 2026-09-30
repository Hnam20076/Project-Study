import type { Flashcard, SRSReviewRating } from '@/types'

export interface SRSResult {
  interval: number
  repetition: number
  easeFactor: number
  nextReviewDate: Date
}

/**
 * Thuật toán lặp lại ngắt quãng SuperMemo SM-2 cho Flashcard
 * @param card Thẻ hiện tại với interval, repetition, easeFactor
 * @param rating Đánh giá của người dùng ('again' | 'hard' | 'good' | 'easy')
 * @param now Thời điểm đánh giá (mặc định là hiện tại)
 */
export function calculateSRS(
  card: { interval?: number; repetition?: number; easeFactor?: number },
  rating: SRSReviewRating,
  now: Date = new Date()
): SRSResult {
  let interval = card.interval ?? 0
  let repetition = card.repetition ?? 0
  let easeFactor = card.easeFactor ?? 2.5

  // Quy đổi rating sang thang điểm SM-2 (0-5)
  let q = 4
  switch (rating) {
    case 'again':
      q = 1
      break
    case 'hard':
      q = 3
      break
    case 'good':
      q = 4
      break
    case 'easy':
      q = 5
      break
  }

  if (q < 3) {
    // Quên/Làm sai: reset chuỗi nhớ
    repetition = 0
    interval = 1 // Ôn lại sau 1 ngày (hoặc trong ngày)
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  } else {
    // Nhớ được: tăng chuỗi nhớ và giãn khoảng cách ôn tập
    if (repetition === 0) {
      interval = rating === 'easy' ? 3 : 1
    } else if (repetition === 1) {
      interval = rating === 'easy' ? 7 : 4
    } else {
      const multiplier = rating === 'hard' ? 1.2 : easeFactor
      interval = Math.max(interval + 1, Math.round(interval * multiplier))
    }
    repetition += 1

    // Cập nhật hệ số dễ (Ease Factor) theo công thức SM-2 chuẩn
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)))
  }

  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
  }
}

/**
 * Kiểm tra xem thẻ đã đến hạn cần ôn tập hay chưa
 */
export function isCardDue(card: Pick<Flashcard, 'nextReviewDate'>, now: Date = new Date()): boolean {
  if (!card.nextReviewDate) return true
  const reviewTime = new Date(card.nextReviewDate).getTime()
  return reviewTime <= now.getTime()
}

/**
 * Lọc danh sách thẻ cần ôn tập hôm nay
 */
export function getDueCards(cards: Flashcard[], now: Date = new Date()): Flashcard[] {
  return cards.filter(card => isCardDue(card, now))
}
