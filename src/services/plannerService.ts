import { scheduleRepo, semesterRepo, taskRepo, flashcardRepo, isTaskOverdue } from '@/db/repositories'
import { dateToWeekNumber, isScheduleInWeek, getWeekDateRange, startOfDayLocal } from './schedule'
import { getDayName, isCurrentlyOngoing, minutesUntilClass } from '@/lib/utils'
import type { ScheduleEntry, Task, Semester } from '@/types'

export interface TodayOverview {
  date: Date
  currentWeek: number | null
  semester?: Semester
  todayClasses: ScheduleEntry[]
  ongoingClass?: ScheduleEntry
  upcomingClass?: ScheduleEntry
  dueTasks: Task[]
  overdueTasks: Task[]
  dueFlashcardsCount: number
  completedTasksTodayCount: number
}

export interface DayAgenda {
  date: Date
  dayOfWeek: number // 0 = CN, 1..6 = T2..T7
  dayName: string
  dateString: string
  classes: ScheduleEntry[]
  tasks: Task[]
  isToday: boolean
}

export interface WeekAgenda {
  weekNumber: number | null
  startDate: Date
  endDate: Date
  days: DayAgenda[]
  totalClasses: number
  totalTasks: number
}

/**
 * Kiểm tra xem 2 ngày có cùng ngày (năm, tháng, ngày) hay không
 */
export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Lấy dữ liệu tổng quan cho Hôm nay (Today Hub)
 */
export async function getTodayOverview(todayDate: Date = new Date()): Promise<TodayOverview> {
  const [schedules, semester, allTasks, dueCards] = await Promise.all([
    scheduleRepo.getAll(),
    semesterRepo.getCurrent(),
    taskRepo.getAll(),
    flashcardRepo.getDueCards(),
  ])

  const currentWeek = dateToWeekNumber(todayDate, semester)
  const todayDayOfWeek = todayDate.getDay() // 0 = CN, 1..6 = T2..T7

  // Tiết học hôm nay
  const todayClasses = schedules
    .filter(s => s.dayOfWeek === todayDayOfWeek && isScheduleInWeek(s, currentWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const ongoingClass = todayClasses.find(s => isCurrentlyOngoing(s.startTime, s.endTime))
  const upcomingClass = todayClasses.find(s => minutesUntilClass(s.startTime) > 0)

  // Nhiệm vụ hôm nay & quá hạn
  const overdueTasks = allTasks.filter(isTaskOverdue)
  const dueTasks = allTasks.filter(t => {
    if (t.status === 'completed' || t.status === 'archived') return false
    if (!t.deadline) return false
    return isSameDay(t.deadline, todayDate)
  })

  // Đếm nhiệm vụ đã xong hôm nay
  const completedTasksTodayCount = allTasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false
    return isSameDay(t.completedAt, todayDate)
  }).length

  return {
    date: todayDate,
    currentWeek,
    semester,
    todayClasses,
    ongoingClass,
    upcomingClass,
    dueTasks,
    overdueTasks,
    dueFlashcardsCount: dueCards.length,
    completedTasksTodayCount,
  }
}

/**
 * Lấy lịch kế hoạch cho cả tuần (Thứ 2 đến Chủ nhật)
 */
export async function getWeekAgenda(
  referenceDate: Date = new Date(),
  customWeek?: number
): Promise<WeekAgenda> {
  const [schedules, semester, allTasks] = await Promise.all([
    scheduleRepo.getAll(),
    semesterRepo.getCurrent(),
    taskRepo.getAll(),
  ])

  const computedWeek = customWeek ?? dateToWeekNumber(referenceDate, semester)

  // Xác định khoảng ngày tuần này (Thứ 2 đến Chủ nhật)
  let weekStart: Date
  let weekEnd: Date

  if (computedWeek && semester?.startDate) {
    const range = getWeekDateRange(semester.startDate, computedWeek)
    weekStart = range.start
    weekEnd = range.end
  } else {
    // Nếu ngoài học kỳ, tính tuần theo referenceDate (Thứ 2 gần nhất)
    const ref = startOfDayLocal(referenceDate)
    const day = ref.getDay() // 0 = CN, 1 = T2...
    const diffToMonday = day === 0 ? -6 : 1 - day
    weekStart = new Date(ref.getTime() + diffToMonday * 86400000)
    weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
    weekEnd.setHours(23, 59, 59, 999)
  }

  const today = new Date()
  const days: DayAgenda[] = []
  let totalClasses = 0
  let totalTasks = 0

  // 7 ngày: Thứ 2 (dayOfWeek = 1) -> Thứ 7 (6) -> Chủ nhật (0)
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart.getTime() + i * 86400000)
    const dayOfWeek = currentDate.getDay() // 1..6, 0
    const isToday = isSameDay(currentDate, today)

    // Lọc tiết học diễn ra trong ngày này và tuần này
    const dayClasses = schedules
      .filter(s => s.dayOfWeek === dayOfWeek && isScheduleInWeek(s, computedWeek))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    // Lọc nhiệm vụ đến hạn trong ngày này
    const dayTasks = allTasks.filter(t => {
      if (!t.deadline) return false
      return isSameDay(t.deadline, currentDate)
    })

    totalClasses += dayClasses.length
    totalTasks += dayTasks.length

    days.push({
      date: currentDate,
      dayOfWeek,
      dayName: getDayName(dayOfWeek),
      dateString: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
      classes: dayClasses,
      tasks: dayTasks,
      isToday,
    })
  }

  return {
    weekNumber: computedWeek,
    startDate: weekStart,
    endDate: weekEnd,
    days,
    totalClasses,
    totalTasks,
  }
}

/**
 * Lấy danh sách nhiệm vụ sắp tới (trong tương lai, chưa hoàn thành)
 */
export async function getUpcomingTasks(limit = 15): Promise<Task[]> {
  const all = await taskRepo.getAll()
  const nowTime = Date.now()

  return all
    .filter(t => {
      if (t.status === 'completed' || t.status === 'archived') return false
      if (!t.deadline) return false
      return new Date(t.deadline).getTime() >= nowTime
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, limit)
}
