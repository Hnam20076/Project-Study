import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { scheduleRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn, getDayName, hasTimeConflict, isCurrentlyOngoing } from '@/lib/utils'
import type { ScheduleEntry, WeekDay } from '@/types'
import { ScheduleFormModal } from './ScheduleFormModal'
import { toast } from 'sonner'

type ViewMode = 'day' | 'week' | 'month'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6:00 - 19:00
const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 0]

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Thứ 2 đầu tuần
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// View tuần - lưới giờ
function WeekView({
  schedules,
  weekStart,
  onEditClass,
}: {
  schedules: ScheduleEntry[]
  weekStart: Date
  onEditClass: (entry: ScheduleEntry) => void
}) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // Kiểm tra xung đột
  function getConflicts(entry: ScheduleEntry): string[] {
    return schedules
      .filter(s => s.id !== entry.id && hasTimeConflict(s, entry))
      .map(s => s.className)
  }

  const timeToPercent = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    const minutes = (h - 6) * 60 + m
    return (minutes / (14 * 60)) * 100
  }

  const durationPercent = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const duration = (eh * 60 + em) - (sh * 60 + sm)
    return (duration / (14 * 60)) * 100
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
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

        {/* Lưới giờ */}
        <div className="relative" style={{ height: `${14 * 60}px` }}>
          {/* Đường kẻ giờ */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-slate-100 dark:border-dark-border/50 flex"
              style={{ top: `${((hour - 6) / 14) * 100}%` }}
            >
              <span className="w-16 text-xs text-slate-400 pr-2 text-right -mt-2.5">
                {hour}:00
              </span>
            </div>
          ))}

          {/* Đường thời gian hiện tại */}
          {(() => {
            const now = new Date()
            const nowMinutes = (now.getHours() - 6) * 60 + now.getMinutes()
            if (nowMinutes >= 0 && nowMinutes <= 14 * 60) {
              return (
                <div
                  className="absolute left-16 right-0 h-0.5 bg-red-500 z-20"
                  style={{ top: `${(nowMinutes / (14 * 60)) * 100}%` }}
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
              const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek)

              return (
                <div key={dayOfWeek} className="relative border-l border-slate-100 dark:border-dark-border/30">
                  {daySchedules.map((entry) => {
                    const top = timeToPercent(entry.startTime)
                    const height = durationPercent(entry.startTime, entry.endTime)
                    const conflicts = getConflicts(entry)
                    const ongoing = isCurrentlyOngoing(entry.startTime, entry.endTime) &&
                      dayOfWeek === new Date().getDay()

                    return (
                      <button
                        key={entry.id}
                        onClick={() => onEditClass(entry)}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left z-10',
                          'text-white text-xs overflow-hidden',
                          'hover:brightness-110 transition-all',
                          ongoing && 'ring-2 ring-white ring-offset-1',
                          conflicts.length > 0 && 'ring-2 ring-red-400'
                        )}
                        style={{
                          top: `${top}%`,
                          height: `${Math.max(height, 3)}%`,
                          backgroundColor: entry.color,
                        }}
                        title={conflicts.length > 0
                          ? `${vi.schedule.conflict}: ${conflicts.join(', ')}`
                          : entry.className
                        }
                      >
                        <div className="font-medium truncate">{entry.className}</div>
                        <div className="opacity-80 text-[10px]">{entry.startTime}–{entry.endTime}</div>
                        {entry.room && <div className="opacity-70 text-[10px] truncate">{entry.room}</div>}
                        {conflicts.length > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full" />
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

// View ngày
function DayView({
  schedules,
  date,
  onEditClass,
}: {
  schedules: ScheduleEntry[]
  date: Date
  onEditClass: (entry: ScheduleEntry) => void
}) {
  const dayOfWeek = date.getDay() as WeekDay
  const daySchedules = schedules
    .filter(s => s.dayOfWeek === dayOfWeek)
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

        return (
          <button
            key={entry.id}
            onClick={() => onEditClass(entry)}
            className={cn(
              'w-full card p-4 text-left flex items-center gap-4',
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
                {entry.room && ` · ${entry.room}`}
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
          const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek)
          const isToday = date.toDateString() === today.toDateString()

          return (
            <button
              key={date.getTime()}
              onClick={() => onSelectDate(date)}
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null)

  const schedules = useLiveQuery(() => scheduleRepo.getAll(), []) ?? []

  const weekStart = getWeekStart(currentDate)

  function navigate(direction: 'prev' | 'next') {
    const d = new Date(currentDate)
    if (viewMode === 'day') {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(d)
  }

  function getTitle(): string {
    if (viewMode === 'day') {
      return `${getDayName(currentDate.getDay())}, ${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
    }
    if (viewMode === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      return `${weekStart.getDate()}/${weekStart.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
    }
    return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
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
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {vi.schedule.title}
            </h1>
            <div className="hidden md:flex items-center gap-1">
              {/* Conflict warnings */}
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

          <div className="flex items-center gap-2">
            {/* View mode */}
            <div className="flex rounded-lg border border-slate-200 dark:border-dark-border overflow-hidden">
              {(['day', 'week', 'month'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted'
                  )}
                >
                  {mode === 'day' ? vi.schedule.viewDay : mode === 'week' ? vi.schedule.viewWeek : vi.schedule.viewMonth}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <button onClick={() => navigate('prev')} className="btn-ghost p-2">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[160px] text-center hidden sm:block">
              {getTitle()}
            </span>
            <button onClick={() => navigate('next')} className="btn-ghost p-2">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary text-xs px-2 py-1.5"
            >
              {vi.schedule.today}
            </button>

            <button onClick={handleNewClass} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{vi.schedule.addClass}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'week' && (
          <WeekView
            schedules={schedules}
            weekStart={weekStart}
            onEditClass={handleEditClass}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            schedules={schedules}
            date={currentDate}
            onEditClass={handleEditClass}
          />
        )}
        {viewMode === 'month' && (
          <MonthView
            schedules={schedules}
            currentDate={currentDate}
            onSelectDate={(date) => {
              setCurrentDate(date)
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
