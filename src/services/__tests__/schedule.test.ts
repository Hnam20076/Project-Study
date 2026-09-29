import { describe, it, expect } from 'vitest'
import {
  HK1_2026_2027_CONFIG,
  getWeekDateRange,
  dateToWeekNumber,
  formatWeekLabel,
  isDateInSemester,
} from '../schedule'
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
