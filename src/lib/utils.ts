import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { vi as viLocale } from 'date-fns/locale'

// Utility để gộp class Tailwind
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Format ngày giờ tiếng Việt
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: viLocale })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm dd/MM/yyyy', { locale: viLocale })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm', { locale: viLocale })
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { locale: viLocale, addSuffix: true })
}

// Chuyển HH:mm thành số phút từ nửa đêm
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Kiểm tra hai tiết học có trùng nhau không (xét cùng thứ, giao giờ VÀ giao nhau ở ít nhất 1 tuần)
export function hasTimeConflict(
  a: { startTime: string; endTime: string; dayOfWeek: number; weeks?: number[] },
  b: { startTime: string; endTime: string; dayOfWeek: number; weeks?: number[] }
): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false
  const aStart = timeToMinutes(a.startTime)
  const aEnd = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd = timeToMinutes(b.endTime)
  const timeOverlap = aStart < bEnd && bStart < aEnd
  if (!timeOverlap) return false

  // Kiểm tra giao tuần: nếu một trong hai rỗng hoặc undefined => học mọi tuần => coi như giao tuần
  const aWeeks = a.weeks ?? []
  const bWeeks = b.weeks ?? []
  if (aWeeks.length === 0 || bWeeks.length === 0) return true

  // Cả hai đều có danh sách tuần: chỉ trùng khi có ít nhất 1 tuần chung
  return aWeeks.some(w => bWeeks.includes(w))
}

// Debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Tạo màu ngẫu nhiên đẹp cho môn học
const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#84cc16', '#f97316',
]

let colorIndex = 0
export function nextPresetColor(): string {
  return PRESET_COLORS[colorIndex++ % PRESET_COLORS.length]
}

// Tính số từ trong HTML content
export function countWordsInHTML(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Lấy tên ngày trong tuần tiếng Việt
export function getDayName(dayOfWeek: number): string {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return days[dayOfWeek] ?? ''
}

// Kiểm tra giờ hiện tại có trong khoảng không
export function isCurrentlyOngoing(startTime: string, endTime: string): boolean {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return nowMinutes >= start && nowMinutes < end
}

// Tính thời gian đếm ngược (phút) đến giờ học
export function minutesUntilClass(startTime: string): number {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const start = timeToMinutes(startTime)
  return start - nowMinutes
}

// Loại bỏ cú pháp LaTeX khỏi chuỗi hiển thị
export function stripLatex(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\$+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

