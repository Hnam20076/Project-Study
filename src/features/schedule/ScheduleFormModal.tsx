import { useState, useEffect } from 'react'
import { X, Trash2, Bell } from 'lucide-react'
import { scheduleRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn, hasTimeConflict, nextPresetColor } from '@/lib/utils'
import type { ScheduleEntry, WeekDay } from '@/types'
import { toast } from 'sonner'

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#84cc16', '#f97316',
]

const DAY_OPTIONS: { value: WeekDay; label: string }[] = [
  { value: 1, label: vi.schedule.days.mon },
  { value: 2, label: vi.schedule.days.tue },
  { value: 3, label: vi.schedule.days.wed },
  { value: 4, label: vi.schedule.days.thu },
  { value: 5, label: vi.schedule.days.fri },
  { value: 6, label: vi.schedule.days.sat },
  { value: 0, label: vi.schedule.days.sun },
]

interface Props {
  entry: ScheduleEntry | null
  allSchedules: ScheduleEntry[]
  onClose: () => void
  onDelete?: () => void
}

export function ScheduleFormModal({ entry, allSchedules, onClose, onDelete }: Props) {
  const isEdit = !!entry

  const [form, setForm] = useState({
    className: entry?.className ?? '',
    classCode: entry?.classCode ?? '',
    teacher: entry?.teacher ?? '',
    room: entry?.room ?? '',
    color: entry?.color ?? nextPresetColor(),
    dayOfWeek: (entry?.dayOfWeek ?? 1) as WeekDay,
    startTime: entry?.startTime ?? '07:30',
    endTime: entry?.endTime ?? '09:30',
    notes: entry?.notes ?? '',
  })

  const [conflicts, setConflicts] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Kiểm tra xung đột realtime
  useEffect(() => {
    const tempEntry = {
      id: entry?.id ?? '__new__',
      startTime: form.startTime,
      endTime: form.endTime,
      dayOfWeek: form.dayOfWeek,
    }
    const conflicted = allSchedules.filter(s =>
      s.id !== (entry?.id ?? '__new__') &&
      hasTimeConflict(s, tempEntry)
    ).map(s => s.className)
    setConflicts(conflicted)
  }, [form.startTime, form.endTime, form.dayOfWeek, allSchedules, entry])

  // Đóng bằng Esc
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.className.trim()) {
      toast.error('Tên môn không được để trống')
      return
    }
    if (form.startTime >= form.endTime) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu')
      return
    }

    setSaving(true)
    try {
      if (isEdit && entry) {
        await scheduleRepo.update(entry.id, {
          ...form,
          updatedAt: new Date(),
        })
        toast.success(vi.toast.updated)
      } else {
        await scheduleRepo.create({
          ...form,
          weeks: [],
          tags: [],
          isDemo: false,
        })
        toast.success(vi.toast.created)

        // Thử xin quyền notification
        if ('Notification' in window && Notification.permission === 'default') {
          const perm = await Notification.requestPermission()
          if (perm === 'granted') {
            toast.info(vi.toast.notificationGranted)
          }
        }
      }
      onClose()
    } catch (e) {
      toast.error(vi.errors.saveFailed)
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-dark-border">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
            {isEdit ? vi.schedule.editClass : vi.schedule.addClass}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Xung đột */}
          {conflicts.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <span className="text-red-500 text-lg">⚠</span>
              <div>
                <div className="text-sm font-medium text-red-700 dark:text-red-400">
                  {vi.schedule.conflictWarning}
                </div>
                <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {vi.schedule.conflict}: {conflicts.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Tên môn */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {vi.schedule.className} *
            </label>
            <input
              className="input"
              value={form.className}
              onChange={e => update('className', e.target.value)}
              placeholder="Ví dụ: Toán Kỹ Thuật"
              autoFocus
            />
          </div>

          {/* Mã môn + Giảng viên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.classCode}
              </label>
              <input
                className="input"
                value={form.classCode}
                onChange={e => update('classCode', e.target.value)}
                placeholder="MATH301"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.teacher}
              </label>
              <input
                className="input"
                value={form.teacher}
                onChange={e => update('teacher', e.target.value)}
                placeholder="TS. Nguyễn Văn A"
              />
            </div>
          </div>

          {/* Phòng học */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {vi.schedule.room}
            </label>
            <input
              className="input"
              value={form.room}
              onChange={e => update('room', e.target.value)}
              placeholder="B101"
            />
          </div>

          {/* Ngày + Giờ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {vi.schedule.weekDays}
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('dayOfWeek', opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    form.dayOfWeek === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.startTime}
              </label>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={e => update('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.endTime}
              </label>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={e => update('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Màu sắc */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {vi.schedule.color}
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update('color', color)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    form.color === color
                      ? 'border-slate-900 dark:border-white scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {vi.schedule.notes}
            </label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Notification note */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Bell className="w-3.5 h-3.5" />
            <span>{vi.schedule.notification}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-dark-border">
          <div>
            {isEdit && onDelete && (
              <button onClick={onDelete} className="btn-danger">
                <Trash2 className="w-4 h-4" />
                {vi.common.delete}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">
              {vi.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? vi.common.loading : vi.common.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
