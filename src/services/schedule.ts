import { format } from 'date-fns'
import { vi } from '@/i18n/vi'
import type { Semester } from '@/types'

/**
 * Cấu hình học kỳ chuẩn HK1 2026-2027
 * Bắt đầu: Thứ 2 ngày 07/09/2026 (Tuần 1)
 * Số tuần: 16
 */
export const HK1_2026_2027_CONFIG = {
  name: 'HK1 2026-2027',
  startDate: new Date('2026-09-07T00:00:00'),
  weeksCount: 16,
  isCurrent: true,
} as const

/**
 * Chuẩn hóa Date về đầu ngày 00:00:00 local time
 */
export function startOfDayLocal(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Tính khoảng ngày { start, end } của một tuần học (Tuần n)
 * Tuần n bắt đầu = startDate + 7*(n - 1) ngày (Thứ 2)
 * Kết thúc = start + 6 ngày (Chủ nhật)
 */
export function getWeekDateRange(
  startDate: Date | string,
  weekNumber: number
): { start: Date; end: Date } {
  const baseStart = startOfDayLocal(startDate)
  const start = new Date(baseStart.getTime() + (weekNumber - 1) * 7 * 86400000)
  const end = new Date(start.getTime() + 6 * 86400000)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Chuyển đổi ngày bất kỳ sang số thứ tự tuần học (1..weeksCount)
 * Trả về null nếu ngày nằm trước ngày bắt đầu học kỳ hoặc sau tuần cuối cùng
 */
export function dateToWeekNumber(
  date: Date | string,
  semester: Pick<Semester, 'startDate' | 'weeksCount'> = HK1_2026_2027_CONFIG
): number | null {
  const d = startOfDayLocal(date)
  const start = startOfDayLocal(semester.startDate)
  const diffDays = Math.floor((d.getTime() - start.getTime()) / 86400000)

  if (diffDays < 0) return null

  const week = Math.floor(diffDays / 7) + 1
  if (week > semester.weeksCount) return null

  return week
}

/**
 * Định dạng nhãn tuần kèm khoảng ngày (vd: "Tuần 4 (28/09 – 04/10/2026)")
 * Trả về "Ngoài học kỳ" nếu weekNumber là null hoặc không hợp lệ
 */
export function formatWeekLabel(
  weekNumber: number | null,
  semester: Pick<Semester, 'startDate' | 'weeksCount'> = HK1_2026_2027_CONFIG
): string {
  if (weekNumber === null || weekNumber < 1 || weekNumber > semester.weeksCount) {
    return vi.schedule.outsideSemester
  }

  const { start, end } = getWeekDateRange(semester.startDate, weekNumber)
  const startStr = format(start, 'dd/MM')
  const endStr = format(end, 'dd/MM/yyyy')
  return `${vi.schedule.week} ${weekNumber} (${startStr} – ${endStr})`
}

/**
 * Kiểm tra xem một đối tượng có thuộc học kỳ hiện tại không
 */
export function isDateInSemester(
  date: Date | string,
  semester: Pick<Semester, 'startDate' | 'weeksCount'> = HK1_2026_2027_CONFIG
): boolean {
  return dateToWeekNumber(date, semester) !== null
}
