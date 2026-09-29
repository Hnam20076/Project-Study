import { db } from './database'
import { scheduleRepo, semesterRepo } from './repositories'
import { HK1_2026_2027_CONFIG } from '@/services/schedule'
import type { ScheduleEntry } from '@/types'

/**
 * Danh sách 7 mục Thời khóa biểu HK1 2026-2027 chuẩn
 * Quy ước dayOfWeek: 0=CN, 1=T2, 2=T3, 5=T6, 6=T7
 */
export const TIMETABLE_HK1_2026_2027: readonly Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 1. Kỹ thuật số (71ELEC30083) | 261_71ELEC30083_01 | T2 | tiết 4-6 | CS3.F.06.11 | Lê Nguyễn Hòa Bình | tuần 1–10
  {
    className: 'Kỹ thuật số',
    classCode: '71ELEC30083',
    classGroupCode: '261_71ELEC30083_01',
    dayOfWeek: 1,
    periodStart: 4,
    periodEnd: 6,
    startTime: '09:35',
    endTime: '12:00',
    room: 'CS3.F.06.11',
    teacher: 'Lê Nguyễn Hòa Bình',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    color: '#3b82f6',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 2. Kỹ thuật số (71ELEC30083) | 261_71ELEC30083_0102 | T7 | 7-11 | CS3.F.01.02 | Lê Nguyễn Hòa Bình | tuần 11–16
  {
    className: 'Kỹ thuật số',
    classCode: '71ELEC30083',
    classGroupCode: '261_71ELEC30083_0102',
    dayOfWeek: 6,
    periodStart: 7,
    periodEnd: 11,
    startTime: '13:00',
    endTime: '17:10',
    room: 'CS3.F.01.02',
    teacher: 'Lê Nguyễn Hòa Bình',
    weeks: [11, 12, 13, 14, 15, 16],
    color: '#3b82f6',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 3. Hệ thống và điều khiển (71ELEC30163) | 261_71ELEC30163_03 | T3 | 4-6 | CS3.F.09.02 | Dương Văn Khải | 1–15
  {
    className: 'Hệ thống và điều khiển',
    classCode: '71ELEC30163',
    classGroupCode: '261_71ELEC30163_03',
    dayOfWeek: 2,
    periodStart: 4,
    periodEnd: 6,
    startTime: '09:35',
    endTime: '12:00',
    room: 'CS3.F.09.02',
    teacher: 'Dương Văn Khải',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    color: '#10b981',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 4. Cơ học vật liệu (71MECA30023) | 261_71MECA30023_01 | T6 | 4-6 | CS3.F.09.02 | Ngô Thị Hoa | 1–15
  {
    className: 'Cơ học vật liệu',
    classCode: '71MECA30023',
    classGroupCode: '261_71MECA30023_01',
    dayOfWeek: 5,
    periodStart: 4,
    periodEnd: 6,
    startTime: '09:35',
    endTime: '12:00',
    room: 'CS3.F.09.02',
    teacher: 'Ngô Thị Hoa',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    color: '#f59e0b',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 5. Kỹ năng công dân toàn cầu (71SSK110023) | 261_71SSK110023_11 | T2 | 7-9 | CS3.J.04.01 | Nguyễn Thị Hoa | 1–14
  {
    className: 'Kỹ năng công dân toàn cầu',
    classCode: '71SSK110023',
    classGroupCode: '261_71SSK110023_11',
    dayOfWeek: 1,
    periodStart: 7,
    periodEnd: 9,
    startTime: '13:00',
    endTime: '15:25',
    room: 'CS3.J.04.01',
    teacher: 'Nguyễn Thị Hoa',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    color: '#8b5cf6',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 6. Kỹ năng công dân toàn cầu (71SSK110023) | 261_71SSK110023_11 | CN | 1-3 | E-LEARNING | Nguyễn Thị Hoa | tuần 2,3,4,6,8,9
  {
    className: 'Kỹ năng công dân toàn cầu',
    classCode: '71SSK110023',
    classGroupCode: '261_71SSK110023_11',
    dayOfWeek: 0,
    periodStart: 1,
    periodEnd: 3,
    startTime: '07:00',
    endTime: '09:25',
    room: 'E-LEARNING',
    teacher: 'Nguyễn Thị Hoa',
    weeks: [2, 3, 4, 6, 8, 9],
    color: '#8b5cf6',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
  // 7. Tư tưởng Hồ Chí Minh (71POLH10042) | 261_71POLH10042_25 | T6 | 7-9 | mặc định CS3.J.03.03 | Nguyễn Văn Đạo | 1–10
  {
    className: 'Tư tưởng Hồ Chí Minh',
    classCode: '71POLH10042',
    classGroupCode: '261_71POLH10042_25',
    dayOfWeek: 5,
    periodStart: 7,
    periodEnd: 9,
    startTime: '13:00',
    endTime: '15:25',
    room: 'CS3.J.03.03',
    teacher: 'Nguyễn Văn Đạo',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    weekOverrides: {
      1: { room: 'CS3.J.03.03' },
      2: { room: 'E-LEARNING' },
      3: { room: 'CS3.J.03.03' },
      4: { room: 'MS-TEAMS' },
      5: { room: 'MS-TEAMS' },
      6: { room: 'E-LEARNING' },
      7: { room: 'CS3.J.03.03' },
      8: { room: 'E-LEARNING' },
      9: { room: 'CS3.J.03.03' },
      10: { room: 'MS-TEAMS' },
    },
    color: '#ef4444',
    isDemo: false,
    tags: ['HK1-2026-2027'],
  },
] as const

/**
 * Hàm nạp thời khóa biểu HK1 2026-2027 đảm bảo tính Idempotent:
 * - Không tạo bản ghi trùng theo (classGroupCode + dayOfWeek + periodStart)
 * - Tự động thiết lập học kỳ HK1 2026-2027 nếu chưa có
 */
export async function loadTimetableHK1_2026_2027(): Promise<{ added: number; skipped: number }> {
  // 1. Đảm bảo học kỳ HK1 2026-2027 tồn tại
  const existingSemesters = await db.semesters.toArray()
  let hk1 = existingSemesters.find(s => s.name === HK1_2026_2027_CONFIG.name)
  if (!hk1) {
    hk1 = await semesterRepo.create({
      name: HK1_2026_2027_CONFIG.name,
      startDate: HK1_2026_2027_CONFIG.startDate,
      weeksCount: HK1_2026_2027_CONFIG.weeksCount,
      isCurrent: true,
      tags: ['HK1-2026-2027'],
    })
  } else if (!hk1.isCurrent) {
    await semesterRepo.setCurrent(hk1.id)
  }

  // 2. Nạp dữ liệu các tiết học không trùng lặp
  const existingSchedules = await db.schedules.toArray()
  let added = 0
  let skipped = 0

  for (const item of TIMETABLE_HK1_2026_2027) {
    const isDuplicate = existingSchedules.some(
      s => s.classGroupCode === item.classGroupCode &&
           s.dayOfWeek === item.dayOfWeek &&
           s.periodStart === item.periodStart
    )

    if (isDuplicate) {
      skipped++
    } else {
      await scheduleRepo.create(item)
      added++
    }
  }

  return { added, skipped }
}
