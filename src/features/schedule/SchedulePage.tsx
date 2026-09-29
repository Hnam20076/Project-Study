import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronLeft, ChevronRight, Clock, Grid } from 'lucide-react'
import { scheduleRepo, semesterRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn, hasTimeConflict, isCurrentlyOngoing } from '@/lib/utils'
import {
  HK1_2026_2027_CONFIG,
  PERIOD_TIMES,
  dateToWeekNumber,
  getWeekDateRange,
  getEffectiveRoom,
  isScheduleInWeek,
  findPeriodsFromTimes,
} from '@/services/schedule'
import type { ScheduleEntry, WeekDay } from '@/types'
import { ScheduleFormModal } from './ScheduleFormModal'
import { toast } from 'sonner'

type ViewMode = 'day' | 'week' | 'month'
type GridMode = 'hour' | 'period'

const GRID_START_HOUR = 6
const GRID_END_HOUR = 22
const HOURS_COUNT = GRID_END_HOUR - GRID_START_HOUR // 16 giờ
const TOTAL_MINUTES = HOURS_COUNT * 60 // 960 phút
const HOURS = Array.from({ length: HOURS_COUNT }, (_, i) => i + GRID_START_HOUR)
const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 0] // T2 -> CN

export function isOnlineRoom(room?: string): boolean {
  if (!room) return false
  const r = room.toUpperCase().trim()
  return r === 'E-LEARNING' || r === 'MS-TEAMS' || r.includes('ONLINE') || r.includes('TEAMS')
}

// View tuần - Lưới giờ (06:00 – 22:00)
function WeekHourView({
  schedules,
  weekStart,
  selectedWeek,
  onEditClass,
}: {
  schedules: ScheduleEntry[]
  weekStart: Date
  selectedWeek: number | null
  onEditClass: (entry: ScheduleEntry) => void
}) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  function getConflicts(entry: ScheduleEntry): string[] {
    return schedules
      .filter(s => s.id !== entry.id && hasTimeConflict(s, entry))
      .map(s => s.className)
  }

  const timeToPercent = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    const minutes = (h - GRID_START_HOUR) * 60 + m
    return (minutes / TOTAL_MINUTES) * 100
  }

  const durationPercent = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const duration = (eh * 60 + em) - (sh * 60 + sm)
    return (duration / TOTAL_MINUTES) * 100
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[750px]">
        {/* Header ngày */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-dark-border mb-1">
          <div className="w-16" />
          {WEEK_DAYS.map((dayOfWeek) => {
            const date = new Date(weekStart)
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            date.setDate(weekStart.getDate() + diff)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div
                key={dayOfWeek}
                className={cn(
                  'text-center py-2 text-xs font-medium',
                  isToday
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <div>{vi.schedule.days[(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[dayOfWeek]]}</div>
                <div className={cn(
                  'text-lg font-bold mt-0.5',
                  isToday && 'w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto'
                )}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Lưới giờ (06:00 - 22:00, 960px) */}
        <div className="relative" style={{ height: `${TOTAL_MINUTES}px` }}>
          {/* Đường kẻ giờ */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-slate-100 dark:border-dark-border/50 flex"
              style={{ top: `${((hour - GRID_START_HOUR) / HOURS_COUNT) * 100}%` }}
            >
              <span className="w-16 text-xs text-slate-400 pr-2 text-right -mt-2.5">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Đường thời gian hiện tại */}
          {(() => {
            const now = new Date()
            const nowMinutes = (now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes()
            if (nowMinutes >= 0 && nowMinutes <= TOTAL_MINUTES) {
              return (
                <div
                  className="absolute left-16 right-0 h-0.5 bg-red-500 z-20"
                  style={{ top: `${(nowMinutes / TOTAL_MINUTES) * 100}%` }}
                >
                  <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )
            }
            return null
          })()}

          {/* Các tiết học */}
          <div className="absolute left-16 right-0 top-0 bottom-0 grid grid-cols-7">
            {WEEK_DAYS.map((dayOfWeek) => {
              const daySchedules = schedules.filter(s =>
                s.dayOfWeek === dayOfWeek && isScheduleInWeek(s, selectedWeek)
              )

              return (
                <div key={dayOfWeek} className="relative border-l border-slate-100 dark:border-dark-border/30">
                  {daySchedules.map((entry) => {
                    const top = timeToPercent(entry.startTime)
                    const height = durationPercent(entry.startTime, entry.endTime)
                    const conflicts = getConflicts(entry)
                    const ongoing = isCurrentlyOngoing(entry.startTime, entry.endTime) &&
                      dayOfWeek === new Date().getDay()
                    const effectiveRoom = getEffectiveRoom(entry, selectedWeek)
                    const isOnline = isOnlineRoom(effectiveRoom)

                    return (
                      <button
                        key={entry.id}
                        onClick={() => onEditClass(entry)}
                        aria-label={`${entry.className} ${entry.startTime} - ${entry.endTime}`}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left z-10',
                          'text-white text-xs overflow-hidden',
                          'hover:brightness-110 transition-all shadow-sm',
                          ongoing && 'ring-2 ring-white ring-offset-1',
                          conflicts.length > 0 && 'ring-2 ring-red-400'
                        )}
                        style={{
                          top: `${top}%`,
                          height: `${Math.max(height, 3.5)}%`,
                          backgroundColor: entry.color,
                        }}
                        title={conflicts.length > 0
                          ? `${vi.schedule.conflict}: ${conflicts.join(', ')}`
                          : entry.className
                        }
                      >
                        <div className="font-semibold truncate">{entry.className}</div>
                        {entry.classGroupCode && (
                          <div className="opacity-75 text-[9px] truncate">{entry.classGroupCode}</div>
                        )}
                        <div className="opacity-80 text-[10px]">{entry.startTime}–{entry.endTime}</div>
                        {effectiveRoom && (
                          <div className="flex items-center gap-1 mt-0.5 truncate text-[10px]">
                            {isOnline ? (
                              <span className="bg-purple-500/90 text-white px-1 rounded text-[9px] font-bold">
                                {vi.schedule.onlineBadge}
                              </span>
                            ) : null}
                            <span className="opacity-80 truncate">{effectiveRoom}</span>
                          </div>
                        )}
                        {conflicts.length > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// View tuần - Lưới tiết (16 tiết học gộp dòng)
function WeekPeriodView({
  schedules,
  weekStart,
  selectedWeek,
  onEditClass,
}: {
  schedules: ScheduleEntry[]
  weekStart: Date
  selectedWeek: number | null
  onEditClass: (entry: ScheduleEntry) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header ngày */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-dark-border mb-1">
          <div className="w-24 text-center py-2 text-xs font-semibold text-slate-400">
            {vi.schedule.period}
          </div>
          {WEEK_DAYS.map((dayOfWeek) => {
            const date = new Date(weekStart)
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            date.setDate(weekStart.getDate() + diff)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div
                key={dayOfWeek}
                className={cn(
                  'text-center py-2 text-xs font-medium',
                  isToday
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <div>{vi.schedule.days[(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[dayOfWeek]]}</div>
                <div className={cn(
                  'text-lg font-bold mt-0.5',
                  isToday && 'w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto'
                )}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Lưới 16 tiết học */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-dark-border">
          {/* Cột thời gian 16 tiết */}
          <div className="flex flex-col border-r border-slate-100 dark:border-dark-border/40">
            {PERIOD_TIMES.map(p => (
              <div
                key={p.period}
                className="h-12 border-b border-slate-100 dark:border-dark-border/30 px-2 flex flex-col justify-center text-right"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  T{p.period}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {p.startTime}–{p.endTime}
                </span>
              </div>
            ))}
          </div>

          {/* 7 cột ngày */}
          {WEEK_DAYS.map(dayOfWeek => {
            const daySchedules = schedules.filter(s =>
              s.dayOfWeek === dayOfWeek && isScheduleInWeek(s, selectedWeek)
            )

            return (
              <div
                key={dayOfWeek}
                className="relative border-r border-slate-100 dark:border-dark-border/30 grid grid-rows-16"
                style={{ height: `${16 * 48}px` }} // 16 hàng x 48px = 768px
              >
                {/* 16 đường ngang mốc tiết */}
                {PERIOD_TIMES.map(p => (
                  <div
                    key={p.period}
                    className="border-b border-slate-100/70 dark:border-dark-border/20 h-12"
                  />
                ))}

                {/* Các khối môn học */}
                {daySchedules.map(entry => {
                  let pStart = entry.periodStart
                  let pEnd = entry.periodEnd

                  // Nếu chưa có periodStart, suy ra từ giờ
                  if (!pStart || !pEnd) {
                    const inferred = findPeriodsFromTimes(entry.startTime, entry.endTime)
                    pStart = inferred.periodStart ?? 1
                    pEnd = inferred.periodEnd ?? pStart
                  }

                  const span = Math.max(1, pEnd - pStart + 1)
                  const top = (pStart - 1) * 48
                  const height = span * 48
                  const effectiveRoom = getEffectiveRoom(entry, selectedWeek)
                  const isOnline = isOnlineRoom(effectiveRoom)
                  const ongoing = isCurrentlyOngoing(entry.startTime, entry.endTime) &&
                    dayOfWeek === new Date().getDay()

                  return (
                    <button
                      key={entry.id}
                      onClick={() => onEditClass(entry)}
                      aria-label={`${entry.className} tiết ${pStart}-${pEnd}`}
                      className={cn(
                        'absolute left-0.5 right-0.5 rounded-md p-1.5 text-left text-white overflow-hidden z-10 transition-all shadow-sm',
                        'hover:brightness-110',
                        ongoing && 'ring-2 ring-white ring-offset-1'
                      )}
                      style={{
                        top: `${top + 2}px`,
                        height: `${height - 4}px`,
                        backgroundColor: entry.color,
                      }}
                    >
                      <div className="font-semibold text-xs leading-tight truncate">
                        {entry.className}
                      </div>
                      {entry.classGroupCode && (
                        <div className="text-[9px] opacity-80 truncate">{entry.classGroupCode}</div>
                      )}
                      <div className="text-[10px] opacity-85 mt-0.5">
                        Tiết {pStart}–{pEnd} ({entry.startTime}–{entry.endTime})
                      </div>
                      {effectiveRoom && (
                        <div className="flex items-center gap-1 mt-0.5 truncate text-[10px]">
                          {isOnline ? (
                            <span className="bg-purple-500/90 text-white px-1 rounded text-[9px] font-bold">
                              {vi.schedule.onlineBadge}
                            </span>
                          ) : null}
                          <span className="opacity-90 truncate">{effectiveRoom}</span>
                        </div>
                      )}
                      {entry.teacher && (
                        <div className="text-[9px] opacity-75 truncate">{entry.teacher}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// View ngày
function DayView({
  schedules,
  date,
  selectedWeek,
  onEditClass,
}: {
  schedules: ScheduleEntry[]
  date: Date
  selectedWeek: number | null
  onEditClass: (entry: ScheduleEntry) => void
}) {
  const dayOfWeek = date.getDay() as WeekDay
  const daySchedules = schedules
    .filter(s => s.dayOfWeek === dayOfWeek && isScheduleInWeek(s, selectedWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (daySchedules.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        {vi.dashboard.noClassToday}
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {daySchedules.map(entry => {
        const conflicts = schedules.filter(s =>
          s.id !== entry.id && hasTimeConflict(s, entry)
        )
        const ongoing = isCurrentlyOngoing(entry.startTime, entry.endTime)
        const effectiveRoom = getEffectiveRoom(entry, selectedWeek)
        const isOnline = isOnlineRoom(effectiveRoom)

        return (
          <button
            key={entry.id}
            onClick={() => onEditClass(entry)}
            aria-label={`${entry.className} ${entry.startTime} - ${entry.endTime}`}
            className={cn(
              'w-full card p-4 text-left flex items-center gap-4 transition-all hover:border-primary-400',
              ongoing && 'ring-2 ring-green-400',
              conflicts.length > 0 && 'ring-2 ring-red-400'
            )}
          >
            <div
              className="w-2 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {entry.className}
                </span>
                {entry.classGroupCode && (
                  <span className="text-xs text-slate-400">({entry.classGroupCode})</span>
                )}
                {isOnline && (
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {vi.schedule.onlineBadge}
                  </span>
                )}
                {ongoing && (
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                    {vi.schedule.ongoing}
                  </span>
                )}
                {conflicts.length > 0 && (
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    ⚠ Trùng lịch
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                {entry.startTime} – {entry.endTime}
                {entry.periodStart && entry.periodEnd && ` (Tiết ${entry.periodStart}–${entry.periodEnd})`}
                {effectiveRoom && ` · ${effectiveRoom}`}
                {entry.teacher && ` · ${entry.teacher}`}
              </div>
              {entry.notes && (
                <div className="text-xs text-slate-400 mt-1">{entry.notes}</div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// View tháng
function MonthView({
  schedules,
  currentDate,
  onSelectDate,
}: {
  schedules: ScheduleEntry[]
  currentDate: Date
  onSelectDate: (date: Date) => void
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7 // Điều chỉnh để Thứ 2 = 0

  const days: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1))
  ]

  const today = new Date()

  return (
    <div className="p-4">
      {/* Header ngày trong tuần */}
      <div className="grid grid-cols-7 mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Lưới ngày */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />

          const dayOfWeek = date.getDay() as WeekDay
          const dayWeek = dateToWeekNumber(date)
          const daySchedules = schedules.filter(s =>
            s.dayOfWeek === dayOfWeek && isScheduleInWeek(s, dayWeek)
          )
          const isToday = date.toDateString() === today.toDateString()

          return (
            <button
              key={date.getTime()}
              onClick={() => onSelectDate(date)}
              aria-label={`Ngày ${date.getDate()}/${month + 1}`}
              className={cn(
                'aspect-square p-1 rounded-lg text-sm flex flex-col items-center',
                'hover:bg-slate-100 dark:hover:bg-dark-muted transition-colors',
                isToday && 'bg-primary-50 dark:bg-primary-950/30'
              )}
            >
              <span className={cn(
                'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                isToday && 'bg-primary-600 text-white'
              )}>
                {date.getDate()}
              </span>
              {daySchedules.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {daySchedules.slice(0, 3).map(s => (
                    <div
                      key={s.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                      title={s.className}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Trang chính Schedule
function ScheduleContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [gridMode, setGridMode] = useState<GridMode>('hour')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null)

  const schedules = useLiveQuery(() => scheduleRepo.getAll(), []) ?? []
  const currentSemester = useLiveQuery(() => semesterRepo.getCurrent(), [])
  const activeSemester = currentSemester ?? {
    ...HK1_2026_2027_CONFIG,
    id: 'default-hk1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
  }

  // Khởi tạo tuần đang chọn (ưu tiên tuần hiện tại nếu trong kỳ, ngược lại tuần 1)
  const initialWeek = dateToWeekNumber(new Date(), activeSemester) ?? 1
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek)

  // Cập nhật weekStart dựa theo selectedWeek
  const { start: weekStart, end: weekEnd } = getWeekDateRange(activeSemester.startDate, selectedWeek)

  function navigateWeek(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      if (selectedWeek > 1) {
        const nextW = selectedWeek - 1
        setSelectedWeek(nextW)
        const { start } = getWeekDateRange(activeSemester.startDate, nextW)
        setCurrentDate(start)
      }
    } else {
      if (selectedWeek < activeSemester.weeksCount) {
        const nextW = selectedWeek + 1
        setSelectedWeek(nextW)
        const { start } = getWeekDateRange(activeSemester.startDate, nextW)
        setCurrentDate(start)
      }
    }
  }

  function handleCurrentWeek() {
    const curW = dateToWeekNumber(new Date(), activeSemester)
    if (curW) {
      setSelectedWeek(curW)
      const { start } = getWeekDateRange(activeSemester.startDate, curW)
      setCurrentDate(start)
    } else {
      toast.info(vi.schedule.outsideSemester)
    }
  }

  function handleEditClass(entry: ScheduleEntry) {
    setEditEntry(entry)
    setShowForm(true)
  }

  function handleNewClass() {
    setEditEntry(null)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(vi.dialog.deleteMessage)
    if (!ok) return
    try {
      await scheduleRepo.delete(id)
      toast.success(vi.toast.deleted)
      setShowForm(false)
    } catch {
      toast.error(vi.errors.deleteFailed)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
        <div className="flex flex-wrap items-center justify-between px-4 py-3 gap-2">
          {/* Title & conflict warning */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {vi.schedule.title}
            </h1>
            <div className="hidden lg:flex items-center gap-1">
              {schedules.some(entry =>
                schedules.some(other =>
                  other.id !== entry.id && hasTimeConflict(entry, other)
                )
              ) && (
                <span className="badge bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  ⚠ Có trùng lịch
                </span>
              )}
            </div>
          </div>

          {/* Thanh chọn tuần (1..16 kèm khoảng ngày) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg px-2 py-1">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={selectedWeek <= 1}
              aria-label={vi.schedule.prevWeek}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-dark-muted disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedWeek}
              onChange={e => {
                const w = Number(e.target.value)
                setSelectedWeek(w)
                const { start } = getWeekDateRange(activeSemester.startDate, w)
                setCurrentDate(start)
              }}
              aria-label={vi.schedule.selectWeek}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
            >
              {Array.from({ length: activeSemester.weeksCount }, (_, i) => i + 1).map(w => (
                <option key={w} value={w} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-dark-surface">
                  Tuần {w}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-dark-border pl-2">
              {weekStart.getDate().toString().padStart(2, '0')}/{(weekStart.getMonth() + 1).toString().padStart(2, '0')} – {weekEnd.getDate().toString().padStart(2, '0')}/{(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/{weekEnd.getFullYear()}
            </span>

            <button
              onClick={() => navigateWeek('next')}
              disabled={selectedWeek >= activeSemester.weeksCount}
              aria-label={vi.schedule.nextWeek}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-dark-muted disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentWeek}
              aria-label={vi.schedule.currentWeek}
              className="btn-ghost text-xs px-2 py-0.5 text-primary-600 dark:text-primary-400 font-medium"
            >
              {vi.schedule.currentWeek}
            </button>
          </div>

          {/* View mode & Action buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle Giờ / Tiết khi ở view Tuần */}
            {viewMode === 'week' && (
              <div className="flex rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden">
                <button
                  onClick={() => setGridMode('hour')}
                  aria-label={vi.schedule.viewHour}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium flex items-center gap-1 transition-colors',
                    gridMode === 'hour'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted'
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{vi.schedule.viewHour}</span>
                </button>
                <button
                  onClick={() => setGridMode('period')}
                  aria-label={vi.schedule.viewPeriod}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium flex items-center gap-1 transition-colors',
                    gridMode === 'period'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted'
                  )}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{vi.schedule.viewPeriod}</span>
                </button>
              </div>
            )}

            {/* View mode: Ngày / Tuần / Tháng */}
            <div className="flex rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden">
              {(['day', 'week', 'month'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-label={mode === 'day' ? vi.schedule.viewDay : mode === 'week' ? vi.schedule.viewWeek : vi.schedule.viewMonth}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted'
                  )}
                >
                  {mode === 'day' ? vi.schedule.viewDay : mode === 'week' ? vi.schedule.viewWeek : vi.schedule.viewMonth}
                </button>
              ))}
            </div>

            <button onClick={handleNewClass} aria-label={vi.schedule.addClass} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{vi.schedule.addClass}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'week' && (
          gridMode === 'hour' ? (
            <WeekHourView
              schedules={schedules}
              weekStart={weekStart}
              selectedWeek={selectedWeek}
              onEditClass={handleEditClass}
            />
          ) : (
            <WeekPeriodView
              schedules={schedules}
              weekStart={weekStart}
              selectedWeek={selectedWeek}
              onEditClass={handleEditClass}
            />
          )
        )}
        {viewMode === 'day' && (
          <DayView
            schedules={schedules}
            date={currentDate}
            selectedWeek={selectedWeek}
            onEditClass={handleEditClass}
          />
        )}
        {viewMode === 'month' && (
          <MonthView
            schedules={schedules}
            currentDate={currentDate}
            onSelectDate={(date) => {
              setCurrentDate(date)
              const w = dateToWeekNumber(date, activeSemester)
              if (w) setSelectedWeek(w)
              setViewMode('day')
            }}
          />
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ScheduleFormModal
          entry={editEntry}
          allSchedules={schedules}
          onClose={() => {
            setShowForm(false)
            setEditEntry(null)
          }}
          onDelete={editEntry ? () => handleDelete(editEntry.id) : undefined}
        />
      )}
    </div>
  )
}

export function SchedulePage() {
  return (
    <ErrorBoundary moduleName={vi.nav.schedule}>
      <ScheduleContent />
    </ErrorBoundary>
  )
}
