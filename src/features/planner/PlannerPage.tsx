import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Calendar,
  CheckSquare,
  GraduationCap,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  getTodayOverview,
  getWeekAgenda,
  getUpcomingTasks,
  type TodayOverview,
  type WeekAgenda,
} from '@/services/plannerService'
import { taskRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { TaskModal } from '@/features/tasks/TaskModal'
import { TaskCard } from '@/features/tasks/TaskCard'
import { subjectRepo } from '@/db/repositories'
import type { Subject } from '@/types'
import { toast } from 'sonner'

type PlannerTab = 'today' | 'thisWeek' | 'upcoming'

export function PlannerPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PlannerTab>('today')
  const [loading, setLoading] = useState(true)

  // Data
  const [todayOverview, setTodayOverview] = useState<TodayOverview | null>(null)
  const [weekAgenda, setWeekAgenda] = useState<WeekAgenda | null>(null)
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [customWeek, setCustomWeek] = useState<number | undefined>(undefined)

  // Task Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Map subjects for cards
  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach(s => map.set(s.id, s))
    return map
  }, [subjects])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [todayData, weekData, upcomingData, allSubjects] = await Promise.all([
        getTodayOverview(),
        getWeekAgenda(new Date(), customWeek),
        getUpcomingTasks(20),
        subjectRepo.getAll(),
      ])
      setTodayOverview(todayData)
      setWeekAgenda(weekData)
      setUpcomingTasks(upcomingData)
      setSubjects(allSubjects)
    } catch (e) {
      console.error(e)
      toast.error(vi.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [customWeek])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleToggleTask(task: Task) {
    try {
      await taskRepo.toggleComplete(task.id)
      loadData()
    } catch (e) {
      console.error(e)
      toast.error(vi.errors.saveFailed)
    }
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  function handleTaskSaved() {
    loadData()
  }

  function handlePrevWeek() {
    if (weekAgenda?.weekNumber && weekAgenda.weekNumber > 1) {
      setCustomWeek(weekAgenda.weekNumber - 1)
    }
  }

  function handleNextWeek() {
    if (weekAgenda?.weekNumber) {
      setCustomWeek(weekAgenda.weekNumber + 1)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-dark-bg p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              {vi.planner.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {vi.planner.subtitle}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white dark:bg-dark-surface p-1 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition',
                activeTab === 'today'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              aria-label={vi.planner.tabs.today}
            >
              {vi.planner.tabs.today}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('thisWeek')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition',
                activeTab === 'thisWeek'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              aria-label={vi.planner.tabs.thisWeek}
            >
              {vi.planner.tabs.thisWeek}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition',
                activeTab === 'upcoming'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              aria-label={vi.planner.tabs.upcoming}
            >
              {vi.planner.tabs.upcoming}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 font-medium">
            {vi.common.loading}
          </div>
        ) : activeTab === 'today' && todayOverview ? (
          /* ================= TODAY TAB ================= */
          <div className="space-y-6">
            {/* Overdue Warning */}
            {todayOverview.overdueTasks.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">
                      {vi.planner.overdueBanner.replace('{count}', String(todayOverview.overdueTasks.length))}
                    </h2>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Hãy ưu tiên hoàn thành để không bị dồn bài tập.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                  aria-label="Xử lý nhiệm vụ quá hạn"
                >
                  Xử lý ngay
                </button>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Tiết học</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {todayOverview.todayClasses.length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">trong ngày hôm nay</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1.5">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Hạn hôm nay</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {todayOverview.dueTasks.length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">nhiệm vụ cần nộp</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Flashcard SRS</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {todayOverview.dueFlashcardsCount}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">thẻ cần ôn tập</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Đã hoàn thành</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {todayOverview.completedTasksTodayCount}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">mục tiêu đã xong</div>
              </div>
            </div>

            {/* Main Content Grid: Schedule vs Tasks vs Flashcard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Today Schedule */}
              <div className="lg:col-span-1 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {vi.planner.scheduleSection}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('/schedule')}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    aria-label="Xem thời khóa biểu đầy đủ"
                  >
                    Thời khóa biểu
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {todayOverview.todayClasses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {vi.planner.noClassesToday}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {todayOverview.todayClasses.map(cls => (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40 flex items-start gap-3"
                      >
                        <div
                          className="w-1.5 h-10 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cls.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {cls.className}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cls.startTime} - {cls.endTime}
                            </span>
                            {cls.room && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-dark-border text-[10px] font-medium">
                                {cls.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Today Tasks */}
              <div className="lg:col-span-1 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                    {vi.planner.tasksSection}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('/tasks')}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    aria-label="Xem tất cả nhiệm vụ"
                  >
                    Xem tất cả
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {todayOverview.dueTasks.length === 0 && todayOverview.overdueTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {vi.planner.noTasksToday}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {/* Overdue section */}
                    {todayOverview.overdueTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        subjectsMap={subjectsMap}
                        onToggleComplete={handleToggleTask}
                        onClick={handleTaskClick}
                      />
                    ))}

                    {/* Today due section */}
                    {todayOverview.dueTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        subjectsMap={subjectsMap}
                        onToggleComplete={handleToggleTask}
                        onClick={handleTaskClick}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: SRS Flashcards & Focus Hub */}
              <div className="lg:col-span-1 space-y-4">
                {/* Flashcard SRS card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm uppercase tracking-wider">
                    <GraduationCap className="w-5 h-5" />
                    {vi.planner.flashcardsSection}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {todayOverview.dueFlashcardsCount > 0
                      ? vi.planner.flashcardsDueMessage.replace('{count}', String(todayOverview.dueFlashcardsCount))
                      : vi.planner.allReviewedMessage}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/quiz?tab=flashcards')}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
                    aria-label={vi.planner.startReview}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{vi.planner.startReview}</span>
                  </button>
                </div>

                {/* Focus Pomodoro Jump */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">
                    <Clock className="w-5 h-5" />
                    {vi.focus.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Bắt đầu phiên học 25 phút Pomodoro để tập trung giải quyết bài tập hôm nay.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/focus')}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-1.5"
                    aria-label="Mở phiên tập trung"
                  >
                    <span>Vào phòng tập trung</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'thisWeek' && weekAgenda ? (
          /* ================= THIS WEEK TAB ================= */
          <div className="space-y-6">
            {/* Week navigation bar */}
            <div className="flex items-center justify-between bg-white dark:bg-dark-surface p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-border transition"
                aria-label="Tuần trước"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="text-center">
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {weekAgenda.weekNumber ? `Tuần học ${weekAgenda.weekNumber}` : 'Kế hoạch tuần'}
                </div>
                <div className="text-xs text-slate-500">
                  {weekAgenda.days[0].dateString} – {weekAgenda.days[6].dateString}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-border transition"
                aria-label="Tuần sau"
              >
                <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* 7-Day Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
              {weekAgenda.days.map(day => (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    'p-3.5 rounded-2xl border bg-white dark:bg-dark-surface flex flex-col space-y-3 min-h-[300px]',
                    day.isToday
                      ? 'ring-2 ring-primary-500 border-primary-500 shadow-md'
                      : 'border-slate-200 dark:border-dark-border shadow-sm'
                  )}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {day.dayName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {day.dateString}
                      </div>
                    </div>
                    {day.isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                        Nay
                      </span>
                    )}
                  </div>

                  {/* Scheduled Classes */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Lịch học ({day.classes.length})
                    </span>
                    {day.classes.map(cls => (
                      <div
                        key={cls.id}
                        className="p-2 rounded-lg text-xs border border-slate-100 dark:border-dark-border"
                        style={{ borderLeftColor: cls.color, borderLeftWidth: 3 }}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {cls.className}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {cls.startTime} - {cls.endTime}
                        </div>
                      </div>
                    ))}
                    {day.classes.length === 0 && (
                      <div className="text-[11px] text-slate-400 italic">Không có tiết</div>
                    )}
                  </div>

                  {/* Tasks Due on this day */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-border flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Nhiệm vụ ({day.tasks.length})
                    </span>
                    {day.tasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleTaskClick(t)}
                        className="p-2 rounded-lg text-xs bg-slate-50 dark:bg-dark-bg cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-border transition"
                      >
                        <div className={cn('font-medium truncate', t.status === 'completed' && 'line-through text-slate-400')}>
                          {t.title}
                        </div>
                      </div>
                    ))}
                    {day.tasks.length === 0 && (
                      <div className="text-[11px] text-slate-400 italic">Không có hạn</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= UPCOMING TAB ================= */
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Nhiệm vụ và mục tiêu sắp tới
            </h2>

            {upcomingTasks.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                Không có nhiệm vụ nào trong tương lai.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subjectsMap={subjectsMap}
                    onToggleComplete={handleToggleTask}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Modal for editing directly from planner */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskSaved}
        />
      )}
    </div>
  )
}
