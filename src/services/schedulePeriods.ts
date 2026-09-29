/**
 * Định nghĩa 16 tiết học chuẩn
 */
export interface PeriodDefinition {
  period: number
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
  note?: string
}

export const PERIOD_TIMES: readonly PeriodDefinition[] = [
  { period: 1,  startTime: '07:00', endTime: '07:45' },
  { period: 2,  startTime: '07:50', endTime: '08:35' },
  { period: 3,  startTime: '08:40', endTime: '09:25' },
  { period: 4,  startTime: '09:35', endTime: '10:20' },
  { period: 5,  startTime: '10:25', endTime: '11:10' },
  { period: 6,  startTime: '11:15', endTime: '12:00' },
  { period: 7,  startTime: '13:00', endTime: '13:45' },
  { period: 8,  startTime: '13:50', endTime: '14:35' },
  { period: 9,  startTime: '14:40', endTime: '15:25' },
  { period: 10, startTime: '15:35', endTime: '16:20' },
  { period: 11, startTime: '16:25', endTime: '17:10' },
  { period: 12, startTime: '17:15', endTime: '18:00' },
  { period: 13, startTime: '18:05', endTime: '18:50' },
  // cần xác nhận: tiết 14 bắt đầu 18:50 trùng giờ kết thúc tiết 13
  { period: 14, startTime: '18:50', endTime: '19:35', note: 'cần xác nhận' },
  // cần xác nhận: tiết 15 chỉ 30 phút
  { period: 15, startTime: '19:50', endTime: '20:20', note: 'cần xác nhận' },
  { period: 16, startTime: '20:25', endTime: '21:10' },
] as const

/**
 * Lấy giờ bắt đầu và giờ kết thúc dựa theo khoảng tiết [periodStart, periodEnd]
 */
export function getPeriodTimes(
  periodStart: number,
  periodEnd: number
): { startTime: string; endTime: string } {
  const pStart = Math.max(1, Math.min(16, periodStart))
  const pEnd = Math.max(pStart, Math.min(16, periodEnd))

  const startDef = PERIOD_TIMES[pStart - 1]
  const endDef = PERIOD_TIMES[pEnd - 1]

  return {
    startTime: startDef.startTime,
    endTime: endDef.endTime,
  }
}

/**
 * Tìm tiết bắt đầu và tiết kết thúc tương ứng với khung giờ HH:mm
 */
export function findPeriodsFromTimes(
  startTime: string,
  endTime: string
): { periodStart?: number; periodEnd?: number } {
  const startMatch = PERIOD_TIMES.find(p => p.startTime === startTime)
  const endMatch = PERIOD_TIMES.find(p => p.endTime === endTime)

  return {
    periodStart: startMatch?.period,
    periodEnd: endMatch?.period,
  }
}

/**
 * Format nhãn hiển thị tiết: "Tiết n (HH:mm–HH:mm)"
 */
export function formatPeriodLabel(period: number): string {
  const def = PERIOD_TIMES.find(p => p.period === period)
  if (!def) return `Tiết ${period}`
  return `Tiết ${def.period} (${def.startTime}–${def.endTime})`
}
