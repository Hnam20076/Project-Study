import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, ensureDBReady } from '../database'
import { semesterRepo, scheduleRepo } from '../repositories'
import { importAllData, exportAllData } from '../exportImport'
import type { ScheduleEntry, Semester } from '@/types'

describe('Database Schema Migration v7 & Export/Import Backward Compatibility (Task 2.3)', () => {
  beforeEach(async () => {
    await ensureDBReady()
  })

  it('successfully opens database with schema v7 and semesters table', async () => {
    expect(db.isOpen()).toBe(true)
    expect(db.verno).toBeGreaterThanOrEqual(7)
    expect(db.tables.some(t => t.name === 'semesters')).toBe(true)
    expect(db.tables.some(t => t.name === 'schedules')).toBe(true)
  })

  it('can create, retrieve and set current semester via semesterRepo', async () => {
    const sem1: Omit<Semester, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'HK1 2026-2027',
      startDate: new Date('2026-09-07T00:00:00'),
      weeksCount: 16,
      isCurrent: true,
      tags: [],
    }

    const created1 = await semesterRepo.create(sem1)
    expect(created1.id).toBeDefined()
    expect(created1.name).toBe('HK1 2026-2027')

    const current = await semesterRepo.getCurrent()
    expect(current?.id).toBe(created1.id)

    const sem2 = await semesterRepo.create({
      name: 'HK2 2026-2027',
      startDate: new Date('2027-02-01T00:00:00'),
      weeksCount: 16,
      isCurrent: false,
      tags: [],
    })

    await semesterRepo.setCurrent(sem2.id)
    const newCurrent = await semesterRepo.getCurrent()
    expect(newCurrent?.id).toBe(sem2.id)
  })

  it('can create and retrieve schedule with S2 optional fields', async () => {
    const entryData: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      className: 'Kỹ thuật số',
      classCode: '71ELEC30083',
      classGroupCode: '261_71ELEC30083_01',
      teacher: 'Lê Nguyễn Hòa Bình',
      room: 'CS3.F.06.11',
      color: '#3b82f6',
      dayOfWeek: 1,
      startTime: '09:35',
      endTime: '12:00',
      periodStart: 4,
      periodEnd: 6,
      weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      weekOverrides: {
        2: { room: 'E-LEARNING' },
        4: { room: 'MS-TEAMS' },
      },
      tags: [],
    }

    const created = await scheduleRepo.create(entryData)
    expect(created.id).toBeDefined()
    expect(created.classGroupCode).toBe('261_71ELEC30083_01')
    expect(created.periodStart).toBe(4)
    expect(created.periodEnd).toBe(6)
    expect(created.weekOverrides?.[2]?.room).toBe('E-LEARNING')

    const fetched = await scheduleRepo.getById(created.id)
    expect(fetched?.classGroupCode).toBe('261_71ELEC30083_01')
    expect(fetched?.weekOverrides?.[4]?.room).toBe('MS-TEAMS')
  })

  it('Acceptance Criteria 8: export → clear → import round-trips data and handles old exports without new fields', async () => {
    // 1. Export current data
    const exported = await exportAllData()
    expect(exported.version).toBeDefined()
    expect(Array.isArray(exported.schedules)).toBe(true)

    // 2. Clear all schedules and semesters
    await db.schedules.clear()
    await db.semesters.clear()
    expect(await db.schedules.count()).toBe(0)

    // 3. Import back
    await importAllData(exported)
    expect(await db.schedules.count()).toBeGreaterThanOrEqual(1)

    // 4. Test import of legacy export file (missing periodStart, classGroupCode, weekOverrides, semesters)
    const legacyExport = {
      version: 5,
      exportedAt: new Date().toISOString(),
      subjects: [],
      topics: [],
      links: [],
      notebooks: [],
      sections: [],
      pages: [],
      noteVersions: [],
      schedules: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          className: 'Toán cao cấp cũ',
          color: '#ef4444',
          dayOfWeek: 2,
          startTime: '07:30',
          endTime: '09:30',
          weeks: [],
        },
      ],
    }

    await importAllData(legacyExport)
    const importedOld = await scheduleRepo.getById('11111111-1111-4111-8111-111111111111')
    expect(importedOld).toBeDefined()
    expect(importedOld?.className).toBe('Toán cao cấp cũ')
    expect(importedOld?.periodStart).toBeUndefined()
  })
})
