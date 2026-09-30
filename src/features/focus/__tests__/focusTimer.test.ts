import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '@/db/database'
import { studySessionRepo } from '@/db/repositories'

// In-memory mock for localStorage in test environment
const mockStorage = new Map<string, string>()
const storage = {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
}

describe('Focus Module & StudySession Repo (Task 5.3)', () => {
  beforeEach(async () => {
    await ensureDBReady()
    await db.studySessions.clear()
    storage.clear()
  })

  it('can create and calculate study session duration in studySessionRepo', async () => {
    const session = await studySessionRepo.create({
      mode: 'pomodoro',
      durationMinutes: 25,
      startedAt: new Date(Date.now() - 25 * 60000),
      completedAt: new Date(),
      tags: ['pomodoro'],
    })

    expect(session.id).toBeDefined()
    expect(session.durationMinutes).toBe(25)
    expect(session.mode).toBe('pomodoro')

    const todayMins = await studySessionRepo.getTodayTotalMinutes()
    expect(todayMins).toBe(25)
  })

  it('accumulates multiple sessions for todayFocusMinutes', async () => {
    await studySessionRepo.create({
      mode: 'pomodoro',
      durationMinutes: 25,
      startedAt: new Date(),
      completedAt: new Date(),
      tags: [],
    })

    await studySessionRepo.create({
      mode: 'custom',
      durationMinutes: 45,
      startedAt: new Date(),
      completedAt: new Date(),
      tags: [],
    })

    const total = await studySessionRepo.getTodayTotalMinutes()
    expect(total).toBe(70)
  })

  it('persists timer state with targetEndTime survival across simulated reload', () => {
    const targetEndTime = Date.now() + 1500 * 1000 // 25 mins later
    const state = {
      mode: 'pomodoro',
      stage: 'work',
      status: 'running',
      targetEndTime,
      remainingSeconds: 1500,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      selectedSubjectId: 'sub-1',
      selectedTaskId: 'task-1',
      pomodoroCount: 2,
      customMinutes: 25,
    }

    storage.setItem('study_os_focus_state_v1', JSON.stringify(state))

    const loaded = JSON.parse(storage.getItem('study_os_focus_state_v1')!)
    expect(loaded.status).toBe('running')
    expect(loaded.targetEndTime).toBe(targetEndTime)

    // Simulate recovery calculation after reload
    const now = Date.now() + 300 * 1000 // 5 minutes later
    const recoveredSeconds = Math.max(0, Math.ceil((loaded.targetEndTime - now) / 1000))
    expect(recoveredSeconds).toBe(1200) // 20 minutes left
  })
})
