import { scheduleRepo, taskRepo, flashcardRepo, semesterRepo } from '@/db/repositories'
import { isScheduleInWeek, dateToWeekNumber, getEffectiveRoom } from './schedule'
import { minutesUntilClass } from '@/lib/utils'
import { vi } from '@/i18n/vi'
import { toast } from 'sonner'

// Set of already notified keys during this browser session to prevent duplicate notifications
const notifiedKeys = new Set<string>()

/**
 * Kiểm tra xem Notification API có được hỗ trợ hay không
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Lấy trạng thái cấp quyền hiện tại
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

/**
 * Yêu cầu quyền thông báo từ người dùng
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    toast.error('Trình duyệt không hỗ trợ Web Notification API')
    return false
  }

  try {
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      toast.success(vi.toast.notificationGranted)
      return true
    } else {
      toast.error(vi.toast.notificationDenied)
      return false
    }
  } catch (e) {
    console.error(e)
    return false
  }
}

/**
 * Phát thông báo (qua Notification API nếu được cấp quyền, hoặc fallback qua Sonner Toast)
 */
export function sendNotification(
  title: string,
  body: string,
  key?: string,
  onClick?: () => void
): void {
  // Tránh spam thông báo lặp lại
  if (key) {
    if (notifiedKeys.has(key)) return
    notifiedKeys.add(key)
  }

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon: './pwa-192x192.png',
        badge: './pwa-192x192.png',
      })
      if (onClick) {
        n.onclick = () => {
          window.focus()
          onClick()
          n.close()
        }
      }
    } catch {
      // Fallback nếu hệ điều hành hoặc trình duyệt chặn
      toast.info(`${title}: ${body}`)
    }
  } else {
    // In-app Toast Fallback
    toast.info(`${title}: ${body}`, {
      duration: 6000,
    })
  }
}

/**
 * Quét và kiểm tra nhắc nhở:
 * 1. Tiết học sắp diễn ra trong vòng 15-30 phút
 * 2. Nhiệm vụ sắp hết hạn trong vòng 60 phút
 * 3. Thẻ flashcard cần ôn tập hôm nay
 */
export async function checkReminders(): Promise<{
  notifiedClasses: number
  notifiedTasks: number
  notifiedFlashcards: number
}> {
  const now = new Date()
  let notifiedClasses = 0
  let notifiedTasks = 0
  let notifiedFlashcards = 0

  try {
    const [schedules, semester, allTasks, dueCards] = await Promise.all([
      scheduleRepo.getAll(),
      semesterRepo.getCurrent(),
      taskRepo.getAll(),
      flashcardRepo.getDueCards(),
    ])

    const currentWeek = dateToWeekNumber(now, semester)
    const todayDayOfWeek = now.getDay()

    // 1. Kiểm tra tiết học hôm nay
    const todayClasses = schedules.filter(
      s => s.dayOfWeek === todayDayOfWeek && isScheduleInWeek(s, currentWeek)
    )

    for (const cls of todayClasses) {
      const mins = minutesUntilClass(cls.startTime)
      // Thông báo khi còn 1 đến 20 phút trước giờ học
      if (mins > 0 && mins <= 20) {
        const effectiveRoom = getEffectiveRoom(cls, currentWeek)
        const key = `class-${cls.id}-${now.toDateString()}`
        sendNotification(
          vi.reminders.classReminderTitle,
          vi.reminders.classReminderBody
            .replace('{name}', cls.className)
            .replace('{time}', cls.startTime)
            .replace('{room}', effectiveRoom || 'chưa rõ phòng'),
          key
        )
        notifiedClasses++
      }
    }

    // 2. Kiểm tra nhiệm vụ sắp đến hạn hôm nay
    const pendingTasks = allTasks.filter(
      t => t.status !== 'completed' && t.status !== 'archived' && t.deadline
    )

    for (const t of pendingTasks) {
      const deadlineTime = new Date(t.deadline!).getTime()
      const diffMinutes = Math.floor((deadlineTime - now.getTime()) / 60000)

      // Nhắc nhở khi còn từ 0 đến 60 phút
      if (diffMinutes >= 0 && diffMinutes <= 60) {
        const key = `task-${t.id}-${now.toDateString()}`
        sendNotification(
          vi.reminders.taskReminderTitle,
          vi.reminders.taskReminderBody.replace('{title}', t.title),
          key
        )
        notifiedTasks++
      }
    }

    // 3. Nhắc nhở ôn tập Flashcards (1 lần mỗi ngày khi có thẻ đến hạn)
    if (dueCards.length > 0) {
      const key = `flashcards-due-${now.toDateString()}`
      if (!notifiedKeys.has(key)) {
        sendNotification(
          vi.reminders.flashcardReminderTitle,
          vi.reminders.flashcardReminderBody.replace('{count}', String(dueCards.length)),
          key
        )
        notifiedFlashcards++
      }
    }
  } catch (err) {
    console.error('Error running checkReminders:', err)
  }

  return { notifiedClasses, notifiedTasks, notifiedFlashcards }
}

/**
 * Khởi chạy chu kỳ kiểm tra nhắc nhở tự động
 */
export function startReminderScheduler(intervalMs = 60000): () => void {
  // Kiểm tra ngay khi khởi động
  checkReminders()

  // Định kỳ quét mỗi 1 phút
  const timer = setInterval(() => {
    checkReminders()
  }, intervalMs)

  return () => clearInterval(timer)
}
