import { useState, useEffect } from 'react'
import { X, Trash2, Bell } from 'lucide-react'
import { scheduleRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn, hasTimeConflict, nextPresetColor } from '@/lib/utils'
import { PERIOD_TIMES, getPeriodTimes } from '@/services/schedule'
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
    classGroupCode: entry?.classGroupCode ?? '',
    teacher: entry?.teacher ?? '',
    room: entry?.room ?? '',
    color: entry?.color ?? nextPresetColor(),
    dayOfWeek: (entry?.dayOfWeek ?? 1) as WeekDay,
    startTime: entry?.startTime ?? '07:00',
    endTime: entry?.endTime ?? '09:25',
    periodStart: entry?.periodStart ?? 1,
    periodEnd: entry?.periodEnd ?? 3,
    weeks: entry?.weeks ?? [] as number[],
    notes: entry?.notes ?? '',
  })

  const [conflicts, setConflicts] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Kiểm tra xung đột realtime (có xét tuần)
  useEffect(() => {
    const tempEntry = {
      id: entry?.id ?? '__new__',
      startTime: form.startTime,
      endTime: form.endTime,
      dayOfWeek: form.dayOfWeek,
      weeks: form.weeks,
    }
    const conflicted = allSchedules.filter(s =>
      s.id !== (entry?.id ?? '__new__') &&
      hasTimeConflict(s, tempEntry)
    ).map(s => s.className)
    setConflicts(conflicted)
  }, [form.startTime, form.endTime, form.dayOfWeek, form.weeks, allSchedules, entry])

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

  function handlePeriodChange(pStart: number, pEnd: number) {
    const validStart = Math.min(pStart, pEnd)
    const validEnd = Math.max(pStart, pEnd)
    const times = getPeriodTimes(validStart, validEnd)
    setForm(prev => ({
      ...prev,
      periodStart: validStart,
      periodEnd: validEnd,
      startTime: times.startTime,
      endTime: times.endTime,
    }))
  }

  function toggleWeek(w: number) {
    setForm(prev => {
      const exists = prev.weeks.includes(w)
      const nextWeeks = exists ? prev.weeks.filter(x => x !== w) : [...prev.weeks, w].sort((a, b) => a - b)
      return { ...prev, weeks: nextWeeks }
    })
  }

  function setQuickWeeks(weeks: number[]) {
    setForm(prev => ({ ...prev, weeks }))
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
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-dark-border">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
            {isEdit ? vi.schedule.editClass : vi.schedule.addClass}
          </h2>
          <button onClick={onClose} aria-label={vi.common.close} className="btn-ghost p-1.5">
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
              placeholder="Ví dụ: Kỹ thuật số"
              autoFocus
              aria-label={vi.schedule.className}
            />
          </div>

          {/* Mã môn & Mã LHP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.classCode}
              </label>
              <input
                className="input"
                value={form.classCode}
                onChange={e => update('classCode', e.target.value)}
                placeholder="71ELEC30083"
                aria-label={vi.schedule.classCode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.classGroupCode}
              </label>
              <input
                className="input"
                value={form.classGroupCode}
                onChange={e => update('classGroupCode', e.target.value)}
                placeholder="261_71ELEC30083_01"
                aria-label={vi.schedule.classGroupCode}
              />
            </div>
          </div>

          {/* Giảng viên & Phòng học */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.teacher}
              </label>
              <input
                className="input"
                value={form.teacher}
                onChange={e => update('teacher', e.target.value)}
                placeholder="Lê Nguyễn Hòa Bình"
                aria-label={vi.schedule.teacher}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {vi.schedule.room}
              </label>
              <input
                className="input"
                value={form.room}
                onChange={e => update('room', e.target.value)}
                placeholder="CS3.F.06.11 hoặc E-LEARNING"
                aria-label={vi.schedule.room}
              />
            </div>
          </div>

          {/* Ngày trong tuần */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {vi.schedule.weekDays}
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
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

          {/* Chọn Tiết học (1..16) -> tự điền giờ */}
          <div className="p-3 bg-slate-50 dark:bg-dark-card rounded-lg border border-slate-200 dark:border-dark-border space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Khung tiết học (1..16)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {vi.schedule.periodStart}
                </label>
                <select
                  aria-label={vi.schedule.periodStart}
                  className="input text-sm"
                  value={form.periodStart ?? 1}
                  onChange={e => handlePeriodChange(Number(e.target.value), form.periodEnd ?? Number(e.target.value))}
                >
                  {PERIOD_TIMES.map(p => (
                    <option key={p.period} value={p.period}>
                      Tiết {p.period} ({p.startTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {vi.schedule.periodEnd}
                </label>
                <select
                  aria-label={vi.schedule.periodEnd}
                  className="input text-sm"
                  value={form.periodEnd ?? 1}
                  onChange={e => handlePeriodChange(form.periodStart ?? 1, Number(e.target.value))}
                >
                  {PERIOD_TIMES.map(p => (
                    <option key={p.period} value={p.period}>
                      Tiết {p.period} ({p.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Giờ bắt đầu - kết thúc thực tế */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {vi.schedule.startTime}
                </label>
                <input
                  type="time"
                  className="input text-xs"
                  value={form.startTime}
                  onChange={e => update('startTime', e.target.value)}
                  aria-label={vi.schedule.startTime}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {vi.schedule.endTime}
                </label>
                <input
                  type="time"
                  className="input text-xs"
                  value={form.endTime}
                  onChange={e => update('endTime', e.target.value)}
                  aria-label={vi.schedule.endTime}
                />
              </div>
            </div>
          </div>

          {/* Chọn tuần học */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {vi.schedule.studyWeeks}
              </label>
              <span className="text-xs text-slate-400">
                {form.weeks.length === 0 ? vi.schedule.allWeeks : `${form.weeks.length} tuần`}
              </span>
            </div>

            {/* Nút chọn nhanh */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setQuickWeeks([])}
                className={cn(
                  'px-2 py-1 rounded border',
                  form.weeks.length === 0
                    ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                    : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400'
                )}
                aria-label={vi.schedule.allWeeks}
              >
                {vi.schedule.allWeeks}
              </button>
              <button
                type="button"
                onClick={() => setQuickWeeks(Array.from({ length: 10 }, (_, i) => i + 1))}
                className="px-2 py-1 rounded border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                aria-label={vi.schedule.weeks1to10}
              >
                {vi.schedule.weeks1to10}
              </button>
              <button
                type="button"
                onClick={() => setQuickWeeks(Array.from({ length: 15 }, (_, i) => i + 1))}
                className="px-2 py-1 rounded border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                aria-label={vi.schedule.weeks1to15}
              >
                {vi.schedule.weeks1to15}
              </button>
              <button
                type="button"
                onClick={() => setQuickWeeks([11, 12, 13, 14, 15, 16])}
                className="px-2 py-1 rounded border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                aria-label={vi.schedule.weeks11to16}
              >
                {vi.schedule.weeks11to16}
              </button>
            </div>

            {/* Checkbox 16 tuần */}
            <div className="grid grid-cols-8 gap-1 pt-1">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(w => {
                const checked = form.weeks.includes(w)
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggleWeek(w)}
                    aria-label={`Tuần ${w}`}
                    className={cn(
                      'py-1 rounded text-xs font-medium text-center border transition-all',
                      checked
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-slate-50 dark:bg-dark-muted text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border'
                    )}
                  >
                    T{w}
                  </button>
                )
              })}
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
                  aria-label={`Chọn màu ${color}`}
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
              aria-label={vi.schedule.notes}
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
              <button onClick={onDelete} aria-label={vi.common.delete} className="btn-danger">
                <Trash2 className="w-4 h-4" />
                {vi.common.delete}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} aria-label={vi.common.cancel} className="btn-secondary">
              {vi.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={vi.common.save}
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
