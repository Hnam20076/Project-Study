import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '../database'
import { flashcardRepo } from '../repositories'
import { importAllData, exportAllData } from '../exportImport'
import type { Flashcard, Question } from '@/types'

describe('Database Schema Migration v8 & SRS Flashcard Repository (Task 4.1)', () => {
  beforeEach(async () => {
    await ensureDBReady()
  })

  it('successfully opens database with schema v8 and flashcards table', async () => {
    expect(db.isOpen()).toBe(true)
    expect(db.verno).toBeGreaterThanOrEqual(8)
    expect(db.tables.some(t => t.name === 'flashcards')).toBe(true)
  })

  it('can create, retrieve and update flashcard via flashcardRepo', async () => {
    const cardData: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'> = {
      subjectId: 'sub-elec',
      front: 'Định luật Ohm là gì?',
      back: '$$I = \\frac{U}{R}$$',
      explanation: 'Cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở.',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date(),
      tags: ['dien-tu', 'co-ban'],
    }

    const created = await flashcardRepo.create(cardData)
    expect(created.id).toBeDefined()
    expect(created.front).toBe('Định luật Ohm là gì?')

    const fetched = await flashcardRepo.getById(created.id)
    expect(fetched).toBeDefined()
    expect(fetched?.back).toBe('$$I = \\frac{U}{R}$$')
  })

  it('can review card using SRS algorithm and advance repetition and interval', async () => {
    const created = await flashcardRepo.create({
      subjectId: 'sub-elec',
      front: 'Transistor BJT gồm mấy cực?',
      back: '3 cực: B (Base), C (Collector), E (Emitter)',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() - 1000), // Due
      tags: [],
    })

    const reviewed = await flashcardRepo.reviewCard(created.id, 'good')
    expect(reviewed).toBeDefined()
    expect(reviewed?.repetition).toBe(1)
    expect(reviewed?.interval).toBe(1)
    expect(reviewed?.nextReviewDate.getTime()).toBeGreaterThan(Date.now())
  })

  it('can convert Question into Flashcard with createFromQuestion', async () => {
    const question: Question = {
      id: 'q-demo-1',
      subjectId: 'sub-math',
      type: 'single',
      prompt: 'Đạo hàm của $\\sin(x)$ là gì?',
      options: [
        { id: 'opt-1', text: '$\\cos(x)$' },
        { id: 'opt-2', text: '$-\\cos(x)$' },
      ],
      correctAnswer: 'opt-1',
      explanation: 'Công thức đạo hàm lượng giác cơ bản: $(\\sin x)\' = \\cos x$.',
      difficulty: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['giai-tich'],
    }

    const card = await flashcardRepo.createFromQuestion(question)
    expect(card.id).toBeDefined()
    expect(card.questionId).toBe('q-demo-1')
    expect(card.front).toBe('Đạo hàm của $\\sin(x)$ là gì?')
    expect(card.back).toBe('$\\cos(x)$')
  })

  it('export → clear → import round-trips flashcards and supports legacy backups without flashcards', async () => {
    // 1. Export current data
    const exported = await exportAllData()
    expect(exported.version).toBeDefined()
    expect(Array.isArray(exported.flashcards)).toBe(true)

    // 2. Clear table
    await db.flashcards.clear()
    expect(await db.flashcards.count()).toBe(0)

    // 3. Import back
    await importAllData(exported)
    expect(await db.flashcards.count()).toBeGreaterThanOrEqual(1)

    // 4. Test legacy backup missing flashcards
    const legacyExport = {
      version: 5,
      exportedAt: new Date().toISOString(),
      subjects: [],
      topics: [],
      links: [],
      schedules: [],
      notebooks: [],
      sections: [],
      pages: [],
      noteVersions: [],
    }

    await expect(importAllData(legacyExport)).resolves.not.toThrow()
  })
})
