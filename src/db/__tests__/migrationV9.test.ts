import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '../database'
import { taskRepo, studySessionRepo, isTaskOverdue } from '../repositories'
import { importAllData, exportAllData } from '../exportImport'
import type { Task, StudySession } from '@/types'

describe('Database Schema Migration v9 & Task / StudySession Repositories (Task 5.1)', () => {
  beforeEach(async () => {
    await ensureDBReady()
  })

  it('successfully opens database with schema v9 and tasks & studySessions tables', async () => {
    expect(db.isOpen()).toBe(true)
    expect(db.verno).toBeGreaterThanOrEqual(9)
    expect(db.tables.some(t => t.name === 'tasks')).toBe(true)
    expect(db.tables.some(t => t.name === 'studySessions')).toBe(true)
  })

  it('can create, retrieve and update a task with taskRepo', async () => {
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'Làm bài tập Mạch tương tự 1',
      description: 'Chương 3: BJT khuếch đại vi sai',
      priority: 'high',
      status: 'todo',
      deadline: new Date(Date.now() + 86400000), // ngày mai
      estimatedMinutes: 60,
      tags: ['dien-tu', 'bai-tap'],
    }

    const created = await taskRepo.create(taskData)
    expect(created.id).toBeDefined()
    expect(created.title).toBe('Làm bài tập Mạch tương tự 1')
    expect(created.priority).toBe('high')
    expect(created.status).toBe('todo')

    const fetched = await taskRepo.getById(created.id)
    expect(fetched).toBeDefined()
    expect(fetched?.estimatedMinutes).toBe(60)

    // Toggle complete
    const toggled = await taskRepo.toggleComplete(created.id)
    expect(toggled?.status).toBe('completed')
    expect(toggled?.completedAt).toBeDefined()

    // Toggle back
    const toggledBack = await taskRepo.toggleComplete(created.id)
    expect(toggledBack?.status).toBe('todo')
    expect(toggledBack?.completedAt).toBeUndefined()
  })

  it('dynamically computes overdue status without mutating persistent database status', async () => {
    const pastDate = new Date(Date.now() - 3600000) // 1 giờ trước
    const overdueTask = await taskRepo.create({
      title: 'Nộp báo cáo Đồ án 1',
      priority: 'urgent',
      status: 'todo', // Persistent status stays 'todo'
      deadline: pastDate,
      tags: ['do-an'],
    })

    expect(isTaskOverdue(overdueTask)).toBe(true)

    // Persisted in DB as status = 'todo'
    const fromDb = await taskRepo.getById(overdueTask.id)
    expect(fromDb?.status).toBe('todo')

    // getOverdue returns it
    const overdues = await taskRepo.getOverdue()
    expect(overdues.some(t => t.id === overdueTask.id)).toBe(true)

    // When completed, it is no longer overdue
    await taskRepo.update(overdueTask.id, { status: 'completed' })
    const updated = await taskRepo.getById(overdueTask.id)
    expect(isTaskOverdue(updated!)).toBe(false)
  })

  it('can create, retrieve and calculate study time with studySessionRepo', async () => {
    const session: Omit<StudySession, 'id' | 'createdAt' | 'updatedAt'> = {
      mode: 'pomodoro',
      durationMinutes: 25,
      startedAt: new Date(Date.now() - 25 * 60000),
      completedAt: new Date(),
      notes: 'Tập trung ôn tập BJT',
      tags: ['focus'],
    }

    const created = await studySessionRepo.create(session)
    expect(created.id).toBeDefined()
    expect(created.durationMinutes).toBe(25)

    const recent = await studySessionRepo.getRecent(5)
    expect(recent.some(s => s.id === created.id)).toBe(true)

    const todayMinutes = await studySessionRepo.getTodayTotalMinutes()
    expect(todayMinutes).toBeGreaterThanOrEqual(25)
  })

  it('exports and imports tasks and studySessions preserving data integrity', async () => {
    const exportData = await exportAllData()
    expect(exportData.tasks).toBeDefined()
    expect(exportData.studySessions).toBeDefined()

    // Test import
    await importAllData(exportData)
    const tasksAfter = await taskRepo.getAll()
    expect(tasksAfter.length).toBe(exportData.tasks?.length)
  })
})
