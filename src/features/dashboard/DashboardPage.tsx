import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Calendar, BookOpen, Clock, Plus, Zap } from 'lucide-react'
import { scheduleRepo, pageRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatRelative, getDayName, isCurrentlyOngoing, minutesUntilClass } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { ScheduleEntry, NotePage } from '@/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return vi.dashboard.greeting.morning
  if (hour < 18) return vi.dashboard.greeting.afternoon
  return vi.dashboard.greeting.evening
}

function getTodayDayOfWeek(): number {
  return new Date().getDay() // 0=CN, 1-6=T2-T7
}

// Widget hiển thị tiết học hiện tại / tiếp theo
function NextClassWidget({ schedules }: { schedules: ScheduleEntry[] }) {
  const [, setTick] = useState(0)

  // Re-render mỗi phút để cập nhật đồng hồ
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const today = getTodayDayOfWeek()
  const todayClasses = schedules
    .filter(s => s.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const ongoing = todayClasses.find(s => isCurrentlyOngoing(s.startTime, s.endTime))
  const upcoming = todayClasses.find(s => minutesUntilClass(s.startTime) > 0)

  if (ongoing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {vi.dashboard.ongoing}
            </span>
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {ongoing.className}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {ongoing.startTime} – {ongoing.endTime} · {ongoing.room ?? ''}
          </div>
        </div>
      </div>
    )
  }

  if (upcoming) {
    const minsLeft = minutesUntilClass(upcoming.startTime)
    const hoursLeft = Math.floor(minsLeft / 60)
    const mins = minsLeft % 60

    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {vi.dashboard.nextClass} · {vi.dashboard.countdown}{' '}
            {hoursLeft > 0 ? `${hoursLeft}${vi.dashboard.hours} ` : ''}
            {mins}{vi.dashboard.minutes}
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {upcoming.className}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {upcoming.startTime} – {upcoming.endTime} · {upcoming.room ?? ''}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border text-center text-sm text-slate-400">
      {vi.dashboard.noNextClass}
    </div>
  )
}

// Card tiết học hôm nay
function TodayScheduleCard({ schedules }: { schedules: ScheduleEntry[] }) {
  const today = getTodayDayOfWeek()
  const todayClasses = schedules
    .filter(s => s.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (todayClasses.length === 0) {
    return (
      <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
        {vi.dashboard.noClassToday}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {todayClasses.map(cls => {
        const isOngoing = isCurrentlyOngoing(cls.startTime, cls.endTime)
        return (
          <div
            key={cls.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-dark-border"
          >
            <div
              className="w-1 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: cls.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {cls.className}
                </span>
                {isOngoing && (
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                    {vi.schedule.ongoing}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {cls.startTime} – {cls.endTime}
                {cls.room && ` · ${cls.room}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Card ghi chú gần đây
function RecentNotesCard({ pages }: { pages: NotePage[] }) {
  const navigate = useNavigate()

  if (pages.length === 0) {
    return (
      <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
        {vi.dashboard.noRecentNotes}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => navigate(`/notes/${page.sectionId}/${page.id}`)}
          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
        >
          <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
            {page.title || vi.common.untitled}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {formatRelative(page.updatedAt)}
          </div>
        </button>
      ))}
    </div>
  )
}

// Dashboard chính
function DashboardContent() {
  const navigate = useNavigate()
  const schedules = useLiveQuery(() => scheduleRepo.getAll(), []) ?? []
  const recentPages = useLiveQuery(() => pageRepo.getRecent(5), []) ?? []

  const today = new Date()
  const dayName = getDayName(today.getDay())
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  // Tổng số tiết tuần này
  const weeklyCount = schedules.filter(s => s.dayOfWeek !== 0 && s.dayOfWeek !== 6).length

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {getGreeting()} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {dayName}, {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notes')}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{vi.dashboard.newNote}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {vi.nav.schedule}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {schedules.filter(s => s.dayOfWeek === today.getDay()).length}
          </div>
          <div className="text-xs text-slate-500">tiết hôm nay</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {vi.nav.notes}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {recentPages.length}
          </div>
          <div className="text-xs text-slate-500">ghi chú gần đây</div>
        </div>

        <div className="card p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Tuần này
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {weeklyCount}
          </div>
          <div className="text-xs text-slate-500">tiết/tuần</div>
        </div>
      </div>

      {/* Grid content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tiết học hôm nay */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              {vi.dashboard.todaySchedule}
            </h2>
            <button
              onClick={() => navigate('/schedule')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <NextClassWidget schedules={schedules} />
          <div className="mt-3">
            <TodayScheduleCard schedules={schedules} />
          </div>
        </div>

        {/* Ghi chú gần đây */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              {vi.dashboard.recentNotes}
            </h2>
            <button
              onClick={() => navigate('/notes')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <RecentNotesCard pages={recentPages} />
        </div>
      </div>
    </div>
  )
}

// Export với Error Boundary
export function DashboardPage() {
  return (
    <ErrorBoundary moduleName={vi.nav.dashboard}>
      <DashboardContent />
    </ErrorBoundary>
  )
}
