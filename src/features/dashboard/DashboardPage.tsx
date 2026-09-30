import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  BookOpen,
  Clock,
  Plus,
  Network,
  GraduationCap,
  Calculator,
  Globe2,
  Cpu,
  CheckSquare,
  CalendarDays,
  Timer,
  Check,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import {
  scheduleRepo,
  pageRepo,
  semesterRepo,
  taskRepo,
  flashcardRepo,
  studySessionRepo,
  isTaskOverdue,
} from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatRelative, getDayName, isCurrentlyOngoing, minutesUntilClass } from '@/lib/utils'
import { dateToWeekNumber, getEffectiveRoom, isScheduleInWeek } from '@/services/schedule'
import { isSameDay } from '@/services/plannerService'
import { useEffect, useState } from 'react'
import type { ScheduleEntry, NotePage, Task } from '@/types'
import { toast } from 'sonner'

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
function NextClassWidget({
  schedules,
  currentWeek,
}: {
  schedules: ScheduleEntry[]
  currentWeek: number | null
}) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const today = getTodayDayOfWeek()
  const todayClasses = schedules
    .filter(s => s.dayOfWeek === today && isScheduleInWeek(s, currentWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const ongoing = todayClasses.find(s => isCurrentlyOngoing(s.startTime, s.endTime))
  const upcoming = todayClasses.find(s => minutesUntilClass(s.startTime) > 0)

  if (ongoing) {
    const effectiveRoom = getEffectiveRoom(ongoing, currentWeek)
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {vi.dashboard.ongoing}
            </span>
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
            {ongoing.className}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {ongoing.startTime} – {ongoing.endTime} {effectiveRoom ? `· ${effectiveRoom}` : ''}
          </div>
        </div>
      </div>
    )
  }

  if (upcoming) {
    const minsLeft = minutesUntilClass(upcoming.startTime)
    const hoursLeft = Math.floor(minsLeft / 60)
    const mins = minsLeft % 60
    const effectiveRoom = getEffectiveRoom(upcoming, currentWeek)

    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {vi.dashboard.nextClass} · {vi.dashboard.countdown}{' '}
            {hoursLeft > 0 ? `${hoursLeft}${vi.dashboard.hours} ` : ''}
            {mins}{vi.dashboard.minutes}
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
            {upcoming.className}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {upcoming.startTime} – {upcoming.endTime} {effectiveRoom ? `· ${effectiveRoom}` : ''}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border text-center text-sm text-slate-400">
      {vi.dashboard.noNextClass}
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
          type="button"
          onClick={() => navigate(`/notes/${page.sectionId}/${page.id}`)}
          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors flex items-center justify-between group"
          aria-label={`Mở ghi chú: ${page.title || vi.common.untitled}`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {page.title || vi.common.untitled}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {formatRelative(page.updatedAt)}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-transform group-hover:translate-x-0.5" />
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
  const currentSemester = useLiveQuery(() => semesterRepo.getCurrent(), [])
  const allTasks = useLiveQuery(() => taskRepo.getAll(), []) ?? []
  const dueCards = useLiveQuery(() => flashcardRepo.getDueCards(), []) ?? []
  const focusMinutesToday = useLiveQuery(() => studySessionRepo.getTodayTotalMinutes(), []) ?? 0

  const today = new Date()
  const currentWeek = dateToWeekNumber(today, currentSemester)
  const dayName = getDayName(today.getDay())
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  // Tasks due today & overdue
  const todayDueTasks = allTasks.filter(t => {
    if (t.status === 'completed' || t.status === 'archived') return false
    if (!t.deadline) return false
    return isSameDay(t.deadline, today)
  })
  const overdueTasks = allTasks.filter(isTaskOverdue)
  const urgentTasksCount = todayDueTasks.length + overdueTasks.length

  async function handleToggleTask(task: Task) {
    try {
      await taskRepo.toggleComplete(task.id)
      toast.success(task.status === 'completed' ? 'Đã mở lại nhiệm vụ' : 'Đã hoàn thành nhiệm vụ')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {dayName}, {dateStr} {currentWeek ? `· Tuần học ${currentWeek}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/planner')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-dark-muted transition shadow-sm"
            aria-label="Xem Kế hoạch"
          >
            <CalendarDays className="w-4 h-4 text-primary-500" />
            <span>Kế hoạch</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="btn-primary"
            aria-label={vi.dashboard.newNote}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{vi.dashboard.newNote}</span>
          </button>
        </div>
      </div>

      {/* Today Hub Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Classes today */}
        <div
          onClick={() => navigate('/schedule')}
          className="card p-4 cursor-pointer hover:border-primary-400 transition"
          role="button"
          tabIndex={0}
          aria-label="Xem lịch học hôm nay"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {vi.nav.schedule}
            </span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {schedules.filter(s => s.dayOfWeek === today.getDay() && isScheduleInWeek(s, currentWeek)).length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">tiết hôm nay</div>
        </div>

        {/* Tasks due today */}
        <div
          onClick={() => navigate('/tasks')}
          className="card p-4 cursor-pointer hover:border-amber-400 transition"
          role="button"
          tabIndex={0}
          aria-label="Xem nhiệm vụ cần làm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {vi.nav.tasks}
            </span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {urgentTasksCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {overdueTasks.length > 0 ? `${overdueTasks.length} quá hạn!` : 'đến hạn hôm nay'}
          </div>
        </div>

        {/* SRS Flashcards */}
        <div
          onClick={() => navigate('/quiz?tab=flashcards')}
          className="card p-4 cursor-pointer hover:border-rose-400 transition"
          role="button"
          tabIndex={0}
          aria-label="Ôn tập Flashcard SRS"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Flashcard SRS
            </span>
            <GraduationCap className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {dueCards.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">thẻ cần ôn hôm nay</div>
        </div>

        {/* Focus Time */}
        <div
          onClick={() => navigate('/focus')}
          className="card p-4 cursor-pointer hover:border-purple-400 transition"
          role="button"
          tabIndex={0}
          aria-label="Vào không gian tập trung"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Tập trung
            </span>
            <Timer className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {focusMinutesToday}m
          </div>
          <div className="text-xs text-slate-500 mt-0.5">đã học hôm nay</div>
        </div>
      </div>

      {/* Main Grid: Today Hub vs Today Tasks */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Tiết học hôm nay */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-primary-500" />
              {vi.dashboard.todaySchedule}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/schedule')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-semibold"
              aria-label="Xem thời khóa biểu đầy đủ"
            >
              Xem tất cả
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <NextClassWidget schedules={schedules} currentWeek={currentWeek} />
          
          {/* Quick list of today classes */}
          <div className="space-y-2">
            {schedules
              .filter(s => s.dayOfWeek === today.getDay() && isScheduleInWeek(s, currentWeek))
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(cls => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cls.className}
                    </span>
                  </div>
                  <div className="text-slate-500 font-medium whitespace-nowrap pl-2">
                    {cls.startTime} - {cls.endTime}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Nhiệm vụ & SRS Today Hub */}
        <div className="space-y-4">
          {/* Tasks widget */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                Nhiệm vụ hôm nay
              </h2>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-semibold"
                aria-label="Xem tất cả nhiệm vụ"
              >
                Xem tất cả
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Overdue alert in widget */}
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Có {overdueTasks.length} nhiệm vụ quá hạn cần xử lý!</span>
              </div>
            )}

            {todayDueTasks.length === 0 && overdueTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không có bài tập nào đến hạn hôm nay.
              </div>
            ) : (
              <div className="space-y-2">
                {[...overdueTasks, ...todayDueTasks].slice(0, 4).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40 text-xs hover:border-slate-300 transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-emerald-500 transition"
                      aria-label={`Đánh dấu hoàn thành: ${task.title}`}
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />}
                    </button>
                    <span
                      onClick={() => navigate(`/tasks?id=${task.id}`)}
                      className="flex-1 font-medium text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-primary-600"
                    >
                      {task.title}
                    </span>
                    {isTaskOverdue(task) && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                        Quá hạn
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flashcards & Focus Quick Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Flashcard SRS</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {dueCards.length > 0 ? `${dueCards.length} thẻ cần ôn` : 'Đã hoàn thành!'}
              </div>
              <button
                type="button"
                onClick={() => navigate('/quiz?tab=flashcards')}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                aria-label="Ôn tập ngay"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ôn ngay</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                <Timer className="w-4 h-4" />
                <span>Focus Pomodoro</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                25 phút tập trung cao độ
              </div>
              <button
                type="button"
                onClick={() => navigate('/focus')}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                aria-label="Bắt đầu học tập"
              >
                <span>Bắt đầu học</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ghi chú gần đây */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            {vi.dashboard.recentNotes}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-semibold"
            aria-label="Xem tất cả ghi chú"
          >
            Xem tất cả
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <RecentNotesCard pages={recentPages} />
      </div>

      {/* Hệ sinh thái học tập (Modules Grid) */}
      <div className="pt-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Hệ sinh thái học tập Study OS
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { title: vi.nav.schedule, path: '/schedule', icon: Calendar, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
            { title: vi.nav.planner, path: '/planner', icon: CalendarDays, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
            { title: vi.nav.tasks, path: '/tasks', icon: CheckSquare, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
            { title: vi.nav.focus, path: '/focus', icon: Timer, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
            { title: vi.nav.notes, path: '/notes', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
            { title: vi.nav.mindmap, path: '/mindmap', icon: Network, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
            { title: vi.nav.quiz, path: '/quiz', icon: GraduationCap, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
            { title: vi.nav.calculator, path: '/calculator', icon: Calculator, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
            { title: vi.nav.knowledge, path: '/knowledge', icon: Globe2, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
            { title: vi.nav.components, path: '/components', icon: Cpu, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
          ].map(mod => {
            const Icon = mod.icon
            return (
              <button
                key={mod.path}
                type="button"
                onClick={() => navigate(mod.path)}
                className="card p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:scale-105"
                aria-label={`Mở module: ${mod.title}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {mod.title}
                </span>
              </button>
            )
          })}
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
