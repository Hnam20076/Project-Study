import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '@/db/database'
import { taskRepo, flashcardRepo } from '@/db/repositories'
import {
  isNotificationSupported,
  getNotificationPermission,
  checkReminders,
} from '../reminderService'

describe('Reminder Service (Task 5.4)', () => {
  beforeEach(async () => {
    await ensureDBReady()
    await db.schedules.clear()
    await db.tasks.clear()
    await db.flashcards.clear()
  })

  it('safely handles notification permission queries in node environment', () => {
    const supported = isNotificationSupported()
    const perm = getNotificationPermission()
    expect(typeof supported).toBe('boolean')
    expect(['default', 'granted', 'denied']).toContain(perm)
  })

  it('scans and alerts for due flashcards and imminent tasks', async () => {
    // Flashcard due
    await flashcardRepo.create({
      subjectId: 'sub-1',
      front: 'Diode zener là gì?',
      back: 'Diode ổn áp hoạt động ở vùng đánh thủng',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() - 1000),
      tags: [],
    })

    // Task due in 30 minutes
    await taskRepo.create({
      title: 'Nộp bài báo cáo số 1',
      status: 'todo',
      priority: 'urgent',
      deadline: new Date(Date.now() + 30 * 60000),
      tags: [],
    })

    const result = await checkReminders()
    expect(result.notifiedTasks).toBe(1)
    expect(result.notifiedFlashcards).toBe(1)
  })
})
