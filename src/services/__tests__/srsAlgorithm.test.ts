import { describe, it, expect } from 'vitest'
import { calculateSRS, isCardDue, getDueCards } from '../srsAlgorithm'
import type { Flashcard } from '@/types'

describe('SRS SM-2 Algorithm', () => {
  const baseCard = {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
  }

  it('handles "again" rating by resetting repetition and setting interval to 1 day', () => {
    const card = { interval: 10, repetition: 4, easeFactor: 2.5 }
    const now = new Date('2026-09-30T12:00:00Z')
    const result = calculateSRS(card, 'again', now)

    expect(result.repetition).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeLessThan(2.5)
    expect(result.nextReviewDate.toISOString()).toBe('2026-10-01T12:00:00.000Z')
  })

  it('handles "good" rating for new card: repetition becomes 1, interval is 1 day', () => {
    const now = new Date('2026-09-30T12:00:00Z')
    const result = calculateSRS(baseCard, 'good', now)

    expect(result.repetition).toBe(1)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBe(2.5)
    expect(result.nextReviewDate.toISOString()).toBe('2026-10-01T12:00:00.000Z')
  })

  it('handles "easy" rating for new card: repetition becomes 1, interval is 3 days, easeFactor increases', () => {
    const now = new Date('2026-09-30T12:00:00Z')
    const result = calculateSRS(baseCard, 'easy', now)

    expect(result.repetition).toBe(1)
    expect(result.interval).toBe(3)
    expect(result.easeFactor).toBeGreaterThan(2.5)
    expect(result.nextReviewDate.toISOString()).toBe('2026-10-03T12:00:00.000Z')
  })

  it('multiplies interval on repeated successful reviews', () => {
    const card = { interval: 4, repetition: 2, easeFactor: 2.5 }
    const now = new Date('2026-09-30T12:00:00Z')
    const result = calculateSRS(card, 'good', now)

    expect(result.repetition).toBe(3)
    expect(result.interval).toBe(10) // 4 * 2.5 = 10
  })

  it('ensures easeFactor does not drop below 1.3', () => {
    let card = { interval: 1, repetition: 0, easeFactor: 1.4 }
    for (let i = 0; i < 5; i++) {
      const result = calculateSRS(card, 'again')
      card = { ...card, easeFactor: result.easeFactor }
    }
    expect(card.easeFactor).toBe(1.3)
  })

  it('correctly identifies due cards', () => {
    const past = new Date('2026-09-29T12:00:00Z')
    const future = new Date('2026-10-05T12:00:00Z')
    const now = new Date('2026-09-30T12:00:00Z')

    expect(isCardDue({ nextReviewDate: past }, now)).toBe(true)
    expect(isCardDue({ nextReviewDate: future }, now)).toBe(false)

    const cards: Flashcard[] = [
      { id: '1', subjectId: 's1', front: 'Q1', back: 'A1', interval: 1, repetition: 1, easeFactor: 2.5, nextReviewDate: past, createdAt: past, updatedAt: past, tags: [] },
      { id: '2', subjectId: 's1', front: 'Q2', back: 'A2', interval: 5, repetition: 2, easeFactor: 2.5, nextReviewDate: future, createdAt: past, updatedAt: past, tags: [] },
    ]

    const due = getDueCards(cards, now)
    expect(due).toHaveLength(1)
    expect(due[0].id).toBe('1')
  })
})
