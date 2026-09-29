import { format, addDays } from 'date-fns'
import type { ScheduleEntry, Semester } from '@/types'
import { getEffectiveRoom } from './schedule'

export interface ICSExportOptions {
  entries: ScheduleEntry[]
  semester: Semester
  mode: 'currentWeek' | 'semester' | 'single'
  targetWeek?: number
  singleEntryId?: string
}

export interface ParsedICSEvent {
  uid?: string
  summary: string
  location?: string
  description?: string
  dtstart: string
  dtend: string
}

/**
 * Escape special characters in text values according to RFC 5545
 */
function escapeICSText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Chuyển đổi ngày và giờ (HH:mm) thành chuỗi iCalendar: YYYYMMDDTHHmm00
 */
function formatICSDateTime(date: Date, timeStr: string): string {
  const [hh, mm] = timeStr.split(':')
  const yyyy = date.getFullYear().toString().padStart(4, '0')
  const MM = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  const hours = (hh ?? '00').padStart(2, '0')
  const minutes = (mm ?? '00').padStart(2, '0')
  return `${yyyy}${MM}${dd}T${hours}${minutes}00`
}

/**
 * Tính ngày thực tế dựa theo tuần học và thứ trong tuần
 * - semester.startDate là Thứ 2 của Tuần 1
 * - dayOfWeek: 1=T2, 2=T3, ..., 6=T7, 0=CN
 */
function calculateClassDate(semesterStartDate: Date | string, weekNumber: number, dayOfWeek: number): Date {
  const start = new Date(semesterStartDate)
  // Day offset tính từ Thứ 2: T2 -> 0, T3 -> 1, ..., T7 -> 5, CN -> 6
  const dayOffsetFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const totalDays = (weekNumber - 1) * 7 + dayOffsetFromMonday
  return addDays(start, totalDays)
}

/**
 * Tạo chuỗi iCalendar RFC 5545 cho Thời khóa biểu
 */
export function generateScheduleICS(options: ICSExportOptions): string {
  const { entries, semester, mode, targetWeek = 1, singleEntryId } = options

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Personal Study OS//VN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    `X-WR-CALNAME:${escapeICSText(semester.name)}`,
  ]

  const nowStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")

  // Xác định danh sách các tuần cần xuất
  let weeksToProcess: number[] = []
  if (mode === 'currentWeek') {
    weeksToProcess = [targetWeek]
  } else {
    weeksToProcess = Array.from({ length: semester.weeksCount }, (_, i) => i + 1)
  }

  // Lọc danh sách môn cần xuất
  const targetEntries = singleEntryId
    ? entries.filter(e => e.id === singleEntryId)
    : entries

  for (const week of weeksToProcess) {
    for (const entry of targetEntries) {
      // Kiểm tra môn có học trong tuần này không
      const hasClassInWeek = entry.weeks.length === 0 || entry.weeks.includes(week)
      if (!hasClassInWeek) continue

      const classDate = calculateClassDate(semester.startDate, week, entry.dayOfWeek)
      const dtStart = formatICSDateTime(classDate, entry.startTime)
      const dtEnd = formatICSDateTime(classDate, entry.endTime)
      const effectiveRoom = getEffectiveRoom(entry, week)

      // Xây dựng mô tả (description)
      const descParts: string[] = []
      if (entry.classGroupCode) descParts.push(`Mã LHP: ${entry.classGroupCode}`)
      if (entry.classCode) descParts.push(`Mã môn: ${entry.classCode}`)
      if (entry.teacher) descParts.push(`Giảng viên: ${entry.teacher}`)
      if (entry.periodStart && entry.periodEnd) descParts.push(`Tiết: ${entry.periodStart}–${entry.periodEnd}`)
      descParts.push(`Tuần: ${week}`)
      if (entry.notes) descParts.push(`Ghi chú: ${entry.notes}`)

      const summary = entry.classCode ? `${entry.className} (${entry.classCode})` : entry.className
      const uid = `studyos-${entry.id || 'class'}-w${week}-${entry.dayOfWeek}@studyos.local`

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${uid}`)
      lines.push(`DTSTAMP:${nowStamp}`)
      lines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`)
      lines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`)
      lines.push(`SUMMARY:${escapeICSText(summary)}`)
      if (effectiveRoom) {
        lines.push(`LOCATION:${escapeICSText(effectiveRoom)}`)
      }
      if (descParts.length > 0) {
        lines.push(`DESCRIPTION:${escapeICSText(descParts.join('\\n'))}`)
      }
      lines.push('END:VEVENT')
    }
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Trình parser đơn giản để kiểm chứng chuỗi ICS sinh ra
 */
export function parseICSString(icsContent: string): ParsedICSEvent[] {
  const events: ParsedICSEvent[] = []
  const eventBlocks = icsContent.split('BEGIN:VEVENT')

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0]
    const lines = block.split(/\r?\n/)
    
    let uid: string | undefined
    let summary = ''
    let location: string | undefined
    let description: string | undefined
    let dtstart = ''
    let dtend = ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (line.startsWith('UID:')) {
        uid = line.substring(4)
      } else if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
      } else if (line.startsWith('LOCATION:')) {
        location = line.substring(9).replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
      } else if (line.includes('DTSTART')) {
        const parts = line.split(':')
        dtstart = parts.slice(1).join(':')
      } else if (line.includes('DTEND')) {
        const parts = line.split(':')
        dtend = parts.slice(1).join(':')
      }
    }

    if (summary && dtstart && dtend) {
      events.push({
        uid,
        summary,
        location,
        description,
        dtstart,
        dtend,
      })
    }
  }

  return events
}

/**
 * Kích hoạt tải file .ics trên trình duyệt
 */
export function downloadICS(content: string, filename = 'schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
