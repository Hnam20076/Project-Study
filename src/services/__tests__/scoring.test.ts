import { describe, it, expect } from 'vitest'
import { scoreAnswer, parseNumericalValue, fisherYatesShuffle } from '../scoring'
import type { Question } from '@/types'

describe('scoring service', () => {
  describe('parseNumericalValue', () => {
    it('parses standard integers and decimals', () => {
      expect(parseNumericalValue('42')).toBe(42)
      expect(parseNumericalValue('3.14')).toBe(3.14)
    })

    it('parses Vietnamese format with comma', () => {
      expect(parseNumericalValue('3,14')).toBe(3.14)
      expect(parseNumericalValue('-0,05')).toBe(-0.05)
    })

    it('parses fractions', () => {
      expect(parseNumericalValue('1/2')).toBe(0.5)
      expect(parseNumericalValue('3/4')).toBe(0.75)
    })

    it('parses scientific notation', () => {
      expect(parseNumericalValue('1.5e-3')).toBe(0.0015)
      expect(parseNumericalValue('2e2')).toBe(200)
    })

    it('returns null for invalid inputs', () => {
      expect(parseNumericalValue('')).toBeNull()
      expect(parseNumericalValue('abc')).toBeNull()
      expect(parseNumericalValue(null)).toBeNull()
    })
  })

  describe('scoreAnswer - single choice', () => {
    const q: Question = {
      id: 'q1',
      prompt: 'Câu hỏi đơn',
      type: 'single',
      subjectId: 'sub1',
      correctAnswer: 'optB',
      explanation: 'Giải thích',
      difficulty: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }

    it('returns correct when match', () => {
      expect(scoreAnswer(q, 'optB')).toEqual({ isCorrect: true, scoreFraction: 1 })
    })

    it('returns incorrect when mismatch or empty', () => {
      expect(scoreAnswer(q, 'optA')).toEqual({ isCorrect: false, scoreFraction: 0 })
      expect(scoreAnswer(q, '')).toEqual({ isCorrect: false, scoreFraction: 0 })
      expect(scoreAnswer(q, undefined)).toEqual({ isCorrect: false, scoreFraction: 0 })
    })
  })

  describe('scoreAnswer - multiple choice', () => {
    const q: Question = {
      id: 'q2',
      prompt: 'Câu hỏi nhiều đáp án',
      type: 'multiple',
      subjectId: 'sub1',
      correctAnswer: ['optA', 'optC'],
      explanation: 'Giải thích',
      difficulty: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }

    it('returns correct regardless of array order', () => {
      expect(scoreAnswer(q, ['optA', 'optC'])).toEqual({ isCorrect: true, scoreFraction: 1 })
      expect(scoreAnswer(q, ['optC', 'optA'])).toEqual({ isCorrect: true, scoreFraction: 1 })
    })

    it('returns false when missing an option', () => {
      expect(scoreAnswer(q, ['optA'])).toEqual({ isCorrect: false, scoreFraction: 0 })
    })

    it('returns false when extra option included', () => {
      expect(scoreAnswer(q, ['optA', 'optB', 'optC'])).toEqual({ isCorrect: false, scoreFraction: 0 })
    })
  })

  describe('scoreAnswer - numerical', () => {
    const q: Question = {
      id: 'q3',
      prompt: 'Tính gia tốc',
      type: 'numerical',
      subjectId: 'sub1',
      correctAnswer: '9.8',
      explanation: 'g = 9.8 m/s^2',
      difficulty: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }

    it('accepts exact number or comma format', () => {
      expect(scoreAnswer(q, '9.8')).toEqual({ isCorrect: true, scoreFraction: 1 })
      expect(scoreAnswer(q, '9,8')).toEqual({ isCorrect: true, scoreFraction: 1 })
    })

    it('accepts answers within tolerance', () => {
      expect(scoreAnswer(q, '9.805', 0.01)).toEqual({ isCorrect: true, scoreFraction: 1 })
      expect(scoreAnswer(q, '9.795', 0.01)).toEqual({ isCorrect: true, scoreFraction: 1 })
    })

    it('rejects answers outside tolerance', () => {
      expect(scoreAnswer(q, '9.85', 0.01)).toEqual({ isCorrect: false, scoreFraction: 0 })
      expect(scoreAnswer(q, '10')).toEqual({ isCorrect: false, scoreFraction: 0 })
    })
  })

  describe('fisherYatesShuffle', () => {
    it('preserves all elements and length', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const shuffled = fisherYatesShuffle(original)
      expect(shuffled).toHaveLength(original.length)
      expect(shuffled.sort((a, b) => a - b)).toEqual(original)
    })

    it('does not mutate original array', () => {
      const original = ['a', 'b', 'c']
      fisherYatesShuffle(original)
      expect(original).toEqual(['a', 'b', 'c'])
    })
  })
})
