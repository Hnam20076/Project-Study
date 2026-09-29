import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '../database'
import { examSessionRepo } from '../repositories'
import type { StoredExamSession } from '@/types'

describe('Database Schema Migration v6', () => {
  beforeEach(async () => {
    await ensureDBReady()
  })

  it('successfully opens database with schema v6 and examSessions table', async () => {
    expect(db.isOpen()).toBe(true)
    expect(db.verno).toBeGreaterThanOrEqual(6)
    expect(db.tables.some(t => t.name === 'examSessions')).toBe(true)
  })

  it('can save, retrieve, and update examSessions', async () => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 600000)
    const session: StoredExamSession = {
      id: 'session-test-1',
      title: 'Đề thi thử',
      subjectId: 'sub-1',
      questions: [],
      currentQIndex: 0,
      userAnswers: { q1: 'opt-a' },
      flaggedQuestionIds: ['q1'],
      durationSeconds: 600,
      startedAt: now,
      expiresAt,
      isSubmitted: false,
      createdAt: now,
      updatedAt: now,
      tags: [],
    }

    await examSessionRepo.save(session)
    const active = await examSessionRepo.getActive()
    expect(active).toBeDefined()
    expect(active?.id).toBe('session-test-1')
    expect(active?.userAnswers).toEqual({ q1: 'opt-a' })

    // Test markSubmitted (single submit guarantee)
    const submitSuccess1 = await examSessionRepo.markSubmitted('session-test-1')
    expect(submitSuccess1).toBe(true)

    // Double submit attempt should return false
    const submitSuccess2 = await examSessionRepo.markSubmitted('session-test-1')
    expect(submitSuccess2).toBe(false)

    // After submit, should no longer be active
    const activeAfterSubmit = await examSessionRepo.getActive()
    expect(activeAfterSubmit).toBeUndefined()
  })
})
