import type { Question } from '@/types'

export interface ScoreResult {
  isCorrect: boolean
  scoreFraction: number // 1 nếu đúng, 0 nếu sai
}

/**
 * Phân tích và chuyển đổi chuỗi số thành number
 * Hỗ trợ định dạng số Việt Nam (dấu phẩy ,), phân số (a/b), số mũ (1.5e-3)
 */
export function parseNumericalValue(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw === 'number') return isFinite(raw) ? raw : null

  const s = String(raw).trim()
  if (!s) return null

  // Xử lý phân số dạng a/b
  if (s.includes('/') && !s.includes(' ')) {
    const parts = s.split('/')
    if (parts.length === 2) {
      const num = Number(parts[0].replace(',', '.'))
      const den = Number(parts[1].replace(',', '.'))
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den
      }
    }
  }

  // Thay dấu phẩy tiếng Việt thành dấu chấm
  const normalized = s.replace(',', '.')
  const val = Number(normalized)
  return (!isNaN(val) && isFinite(val)) ? val : null
}

/**
 * Chấm điểm câu trả lời của thí sinh cho một câu hỏi
 */
export function scoreAnswer(
  question: Question,
  userAnswer: string | string[] | undefined | null,
  tolerance = 0.01
): ScoreResult {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return { isCorrect: false, scoreFraction: 0 }
  }

  // 1. Câu hỏi một đáp án (single choice)
  if (question.type === 'single') {
    const userStr = String(userAnswer).trim()
    const correctStr = String(question.correctAnswer).trim()
    const isCorrect = userStr === correctStr
    return { isCorrect, scoreFraction: isCorrect ? 1 : 0 }
  }

  // 2. Câu hỏi nhiều đáp án (multiple choice)
  if (question.type === 'multiple') {
    const userArray = Array.isArray(userAnswer)
      ? userAnswer
      : [String(userAnswer)]
    const correctArray = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [String(question.correctAnswer)]

    const userSet = new Set(userArray.map(s => String(s).trim()).filter(Boolean))
    const correctSet = new Set(correctArray.map(s => String(s).trim()).filter(Boolean))

    if (userSet.size !== correctSet.size) {
      return { isCorrect: false, scoreFraction: 0 }
    }

    const isCorrect = [...userSet].every(item => correctSet.has(item))
    return { isCorrect, scoreFraction: isCorrect ? 1 : 0 }
  }

  // 3. Câu hỏi nhập đáp án số (numerical)
  if (question.type === 'numerical') {
    const userVal = parseNumericalValue(Array.isArray(userAnswer) ? userAnswer[0] : userAnswer)
    const correctVal = parseNumericalValue(
      Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer
    )

    if (userVal === null || correctVal === null) {
      return { isCorrect: false, scoreFraction: 0 }
    }

    const diff = Math.abs(userVal - correctVal)
    const isCorrect = diff <= tolerance
    return { isCorrect, scoreFraction: isCorrect ? 1 : 0 }
  }

  return { isCorrect: false, scoreFraction: 0 }
}

/**
 * Thuật toán xáo trộn Fisher-Yates chuẩn O(n)
 */
export function fisherYatesShuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
