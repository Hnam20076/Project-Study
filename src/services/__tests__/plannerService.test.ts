import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '@/db/database'
import { scheduleRepo, semesterRepo, taskRepo, flashcardRepo } from '@/db/repositories'
import {
  isSameDay,
  getTodayOverview,
  getWeekAgenda,
  getUpcomingTasks,
} from '../plannerService'

describe('Planner Service (Task 5.2)', () => {
  beforeEach(async () => {
    await ensureDBReady()
    await db.schedules.clear()
    await db.semesters.clear()
    await db.tasks.clear()
    await db.flashcards.clear()
  })

  it('correctly compares same day with isSameDay', () => {
    const d1 = new Date('2026-10-01T08:30:00')
    const d2 = new Date('2026-10-01T17:45:00')
    const d3 = new Date('2026-10-02T08:30:00')

    expect(isSameDay(d1, d2)).toBe(true)
    expect(isSameDay(d1, d3)).toBe(false)
  })

  it('aggregates today classes, tasks, overdue tasks and flashcards in getTodayOverview', async () => {
    // Semester starting 2026-09-07
    await semesterRepo.create({
      name: 'HK1 2026-2027',
      startDate: new Date('2026-09-07T00:00:00'),
      weeksCount: 16,
      isCurrent: true,
      tags: [],
    })

    // Simulated today: Wednesday (dayOfWeek = 3), Tuần 4: 2026-09-30
    const mockToday = new Date('2026-09-30T10:00:00')

    // Schedule: 1 class on Wednesday week 4, 1 class on Wednesday week 5 only
    await scheduleRepo.create({
      className: 'Kỹ thuật vi xử lý',
      color: '#6366f1',
      dayOfWeek: 3,
      startTime: '07:50',
      endTime: '09:25',
      weeks: [1, 2, 3, 4], // Active week 4
      room: 'B204',
      tags: [],
    })

    await scheduleRepo.create({
      className: 'Mạng máy tính',
      color: '#ec4899',
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '15:25',
      weeks: [5, 6, 7], // Inactive week 4
      room: 'C102',
      tags: [],
    })

    // Task due today
    await taskRepo.create({
      title: 'Nộp bài tập vi xử lý',
      status: 'todo',
      priority: 'high',
      deadline: new Date('2026-09-30T23:59:00'),
      tags: [],
    })

    // Overdue task
    await taskRepo.create({
      title: 'Bài tập tuần trước',
      status: 'todo',
      priority: 'urgent',
      deadline: new Date('2026-09-20T23:59:00'),
      tags: [],
    })

    // Due flashcard
    await flashcardRepo.create({
      subjectId: 'sub-elec',
      front: 'Timer 0 AVR có mấy bit?',
      back: '8 bit',
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date('2026-09-29T00:00:00'),
      tags: [],
    })

    const overview = await getTodayOverview(mockToday)

    expect(overview.currentWeek).toBe(4)
    expect(overview.todayClasses.length).toBe(1)
    expect(overview.todayClasses[0].className).toBe('Kỹ thuật vi xử lý')
    expect(overview.dueTasks.length).toBe(1)
    expect(overview.dueTasks[0].title).toBe('Nộp bài tập vi xử lý')
    expect(overview.overdueTasks.length).toBe(1)
    expect(overview.dueFlashcardsCount).toBe(1)
  })

  it('generates 7-day week agenda with getWeekAgenda', async () => {
    const mockRefDate = new Date('2026-09-30T10:00:00') // Wednesday
    const weekAgenda = await getWeekAgenda(mockRefDate)

    expect(weekAgenda.days.length).toBe(7)
    // First day is Monday (dayOfWeek = 1)
    expect(weekAgenda.days[0].dayOfWeek).toBe(1)
    // Last day is Sunday (dayOfWeek = 0)
    expect(weekAgenda.days[6].dayOfWeek).toBe(0)
  })

  it('filters and sorts future tasks with getUpcomingTasks', async () => {
    const futureDate1 = new Date(Date.now() + 86400000)
    const futureDate2 = new Date(Date.now() + 2 * 86400000)

    await taskRepo.create({
      title: 'Task sau 2 ngày',
      status: 'todo',
      priority: 'medium',
      deadline: futureDate2,
      tags: [],
    })

    await taskRepo.create({
      title: 'Task ngày mai',
      status: 'todo',
      priority: 'high',
      deadline: futureDate1,
      tags: [],
    })

    const upcoming = await getUpcomingTasks(5)
    expect(upcoming.length).toBe(2)
    expect(upcoming[0].title).toBe('Task ngày mai')
    expect(upcoming[1].title).toBe('Task sau 2 ngày')
  })
})
