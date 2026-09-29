import { describe, it, expect } from 'vitest'
import {
  HK1_2026_2027_CONFIG,
  getWeekDateRange,
  dateToWeekNumber,
  formatWeekLabel,
  isDateInSemester,
  PERIOD_TIMES,
  getPeriodTimes,
  findPeriodsFromTimes,
  getEffectiveRoom,
  isScheduleInWeek,
} from '../schedule'
import { hasTimeConflict } from '@/lib/utils'
import { vi } from '@/i18n/vi'
import { format } from 'date-fns'

describe('Task 2.1: Semester & Week Calculation', () => {
  it('Tuần 1 bắt đầu 07/09/2026 và kết thúc 13/09/2026', () => {
    const { start, end } = getWeekDateRange(HK1_2026_2027_CONFIG.startDate, 1)
    expect(format(start, 'yyyy-MM-dd')).toBe('2026-09-07')
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-09-13')
  })

  it('Ngày 29/09/2026 thuộc Tuần 4 (28/09 – 04/10/2026) (Tiêu chí 5)', () => {
    const testDate = new Date('2026-09-29T10:00:00')
    const week = dateToWeekNumber(testDate, HK1_2026_2027_CONFIG)
    expect(week).toBe(4)

    const { start, end } = getWeekDateRange(HK1_2026_2027_CONFIG.startDate, 4)
    expect(format(start, 'dd/MM/yyyy')).toBe('28/09/2026')
    expect(format(end, 'dd/MM/yyyy')).toBe('04/10/2026')

    const label = formatWeekLabel(week, HK1_2026_2027_CONFIG)
    expect(label).toBe('Tuần 4 (28/09 – 04/10/2026)')
  })

  it('Tuần 16 kết thúc vào ngày 27/12/2026', () => {
    const { start, end } = getWeekDateRange(HK1_2026_2027_CONFIG.startDate, 16)
    expect(format(start, 'dd/MM/yyyy')).toBe('21/12/2026')
    expect(format(end, 'dd/MM/yyyy')).toBe('27/12/2026')

    const testDate = new Date('2026-12-25T14:00:00')
    expect(dateToWeekNumber(testDate, HK1_2026_2027_CONFIG)).toBe(16)
  })

  it('Ngày trước học kỳ (vd: 06/09/2026) trả về null và format "Ngoài học kỳ"', () => {
    const beforeDate = new Date('2026-09-06T23:59:59')
    const week = dateToWeekNumber(beforeDate, HK1_2026_2027_CONFIG)
    expect(week).toBeNull()
    expect(isDateInSemester(beforeDate, HK1_2026_2027_CONFIG)).toBe(false)
    expect(formatWeekLabel(week, HK1_2026_2027_CONFIG)).toBe(vi.schedule.outsideSemester)
  })

  it('Ngày sau học kỳ (vd: 28/12/2026) trả về null và format "Ngoài học kỳ"', () => {
    const afterDate = new Date('2026-12-28T00:00:00')
    const week = dateToWeekNumber(afterDate, HK1_2026_2027_CONFIG)
    expect(week).toBeNull()
    expect(isDateInSemester(afterDate, HK1_2026_2027_CONFIG)).toBe(false)
    expect(formatWeekLabel(week, HK1_2026_2027_CONFIG)).toBe(vi.schedule.outsideSemester)
  })
})

describe('Task 2.2: PERIOD_TIMES & Period ↔ Time Conversion', () => {
  it('Định nghĩa đủ 16 tiết học chuẩn', () => {
    expect(PERIOD_TIMES).toHaveLength(16)
    expect(PERIOD_TIMES[0].period).toBe(1)
    expect(PERIOD_TIMES[15].period).toBe(16)
  })

  it('Ghi nhận comment "cần xác nhận" ở tiết 14 và tiết 15', () => {
    const p14 = PERIOD_TIMES.find(p => p.period === 14)!
    const p15 = PERIOD_TIMES.find(p => p.period === 15)!

    expect(p14.startTime).toBe('18:50')
    expect(p14.endTime).toBe('19:35')
    expect(p14.note).toBe('cần xác nhận')

    expect(p15.startTime).toBe('19:50')
    expect(p15.endTime).toBe('20:20')
    expect(p15.note).toBe('cần xác nhận')
  })

  it('Khớp chính xác giờ của các môn theo tiêu chí 6', () => {
    // KTS T2: tiết 4-6
    expect(getPeriodTimes(4, 6)).toEqual({ startTime: '09:35', endTime: '12:00' })

    // KNCĐ T2: tiết 7-9
    expect(getPeriodTimes(7, 9)).toEqual({ startTime: '13:00', endTime: '15:25' })

    // KNCĐ CN: tiết 1-3
    expect(getPeriodTimes(1, 3)).toEqual({ startTime: '07:00', endTime: '09:25' })

    // KTS T7 (tuần 11-16): tiết 7-11
    expect(getPeriodTimes(7, 11)).toEqual({ startTime: '13:00', endTime: '17:10' })
  })

  it('findPeriodsFromTimes ánh xạ ngược đúng giờ sang tiết', () => {
    expect(findPeriodsFromTimes('09:35', '12:00')).toEqual({ periodStart: 4, periodEnd: 6 })
    expect(findPeriodsFromTimes('13:00', '17:10')).toEqual({ periodStart: 7, periodEnd: 11 })
  })
})

describe('Task 2.4: Week Filtering, Overrides & Advanced Time Conflict Detection', () => {
  it('hasTimeConflict: A (T2 8:00–10:00 tuần 1–8) vs B (T2 8:30–9:30 tuần 10–16) KHÔNG trùng lịch', () => {
    const classA = {
      startTime: '08:00',
      endTime: '10:00',
      dayOfWeek: 1,
      weeks: [1, 2, 3, 4, 5, 6, 7, 8],
    }
    const classB = {
      startTime: '08:30',
      endTime: '09:30',
      dayOfWeek: 1,
      weeks: [10, 11, 12, 13, 14, 15, 16],
    }
    expect(hasTimeConflict(classA, classB)).toBe(false)
  })

  it('hasTimeConflict: A (T2 8:00–10:00 tuần 1–8) vs B (T2 8:30–9:30 tuần 5–12) CÓ trùng lịch do giao tuần 5-8', () => {
    const classA = {
      startTime: '08:00',
      endTime: '10:00',
      dayOfWeek: 1,
      weeks: [1, 2, 3, 4, 5, 6, 7, 8],
    }
    const classB = {
      startTime: '08:30',
      endTime: '09:30',
      dayOfWeek: 1,
      weeks: [5, 6, 7, 8, 9, 10, 11, 12],
    }
    expect(hasTimeConflict(classA, classB)).toBe(true)
  })

  it('hasTimeConflict: rỗng weeks = tất cả các tuần => báo trùng nếu trùng giờ', () => {
    const classAllWeeks = {
      startTime: '08:00',
      endTime: '10:00',
      dayOfWeek: 1,
      weeks: [],
    }
    const classSpecific = {
      startTime: '08:30',
      endTime: '09:30',
      dayOfWeek: 1,
      weeks: [10],
    }
    expect(hasTimeConflict(classAllWeeks, classSpecific)).toBe(true)
  })

  it('hasTimeConflict: khác thứ không bao giờ trùng', () => {
    const classMon = { startTime: '08:00', endTime: '10:00', dayOfWeek: 1, weeks: [1] }
    const classTue = { startTime: '08:00', endTime: '10:00', dayOfWeek: 2, weeks: [1] }
    expect(hasTimeConflict(classMon, classTue)).toBe(false)
  })

  it('getEffectiveRoom trả về phòng override theo tuần hoặc phòng mặc định', () => {
    const entry = {
      room: 'CS3.J.03.03',
      weekOverrides: {
        2: { room: 'E-LEARNING' },
        4: { room: 'MS-TEAMS' },
      },
    }

    expect(getEffectiveRoom(entry, 1)).toBe('CS3.J.03.03')
    expect(getEffectiveRoom(entry, 2)).toBe('E-LEARNING')
    expect(getEffectiveRoom(entry, 3)).toBe('CS3.J.03.03')
    expect(getEffectiveRoom(entry, 4)).toBe('MS-TEAMS')
  })

  it('isScheduleInWeek kiểm tra chính xác theo danh sách tuần', () => {
    const entrySpecific = { weeks: [2, 3, 4, 6, 8, 9] }
    expect(isScheduleInWeek(entrySpecific, 2)).toBe(true)
    expect(isScheduleInWeek(entrySpecific, 5)).toBe(false)
    expect(isScheduleInWeek(entrySpecific, 7)).toBe(false)
    expect(isScheduleInWeek(entrySpecific, 10)).toBe(false)

    // Rỗng weeks = mọi tuần
    const entryAll = { weeks: [] }
    expect(isScheduleInWeek(entryAll, 5)).toBe(true)
    expect(isScheduleInWeek(entryAll, null)).toBe(true)
  })
})
