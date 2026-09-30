import { Check, Clock, AlertTriangle, Calendar, Tag } from 'lucide-react'
import { isTaskOverdue } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Task, Subject } from '@/types'

interface Props {
  task: Task
  subjectsMap: Map<string, Subject>
  onToggleComplete: (task: Task) => void
  onClick: (task: Task) => void
}

const PRIORITY_CONFIG = {
  urgent: {
    label: vi.tasks.priority.urgent,
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
  },
  high: {
    label: vi.tasks.priority.high,
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  },
  medium: {
    label: vi.tasks.priority.medium,
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  },
  low: {
    label: vi.tasks.priority.low,
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
}

export function TaskCard({ task, subjectsMap, onToggleComplete, onClick }: Props) {
  const isOverdue = isTaskOverdue(task)
  const isCompleted = task.status === 'completed'
  const subject = task.subjectId ? subjectsMap.get(task.subjectId) : undefined
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  // Format deadline
  let deadlineStr = ''
  let isDueToday = false
  if (task.deadline) {
    const d = new Date(task.deadline)
    const today = new Date()
    const isSameDay =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()

    if (isSameDay) {
      isDueToday = true
      deadlineStr = `${vi.tasks.dueToday} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    } else {
      deadlineStr = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
  }

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border bg-white dark:bg-dark-surface cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700',
        isCompleted
          ? 'opacity-65 border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
          : 'border-slate-200 dark:border-dark-border shadow-sm'
      )}
      tabIndex={0}
      role="button"
      aria-label={`Nhiệm vụ: ${task.title}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(task)
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleComplete(task)
          }}
          className={cn(
            'flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors',
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-dark-bg'
          )}
          aria-label={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Priority Badge */}
            <span
              className={cn(
                'px-2 py-0.5 text-[11px] font-semibold rounded-full border',
                priorityInfo.bg
              )}
            >
              {priorityInfo.label}
            </span>

            {/* Subject Badge */}
            {subject && (
              <span
                className="px-2 py-0.5 text-[11px] font-medium rounded-full truncate max-w-[130px]"
                style={{
                  backgroundColor: `${subject.color}15`,
                  color: subject.color,
                  border: `1px solid ${subject.color}35`,
                }}
              >
                {subject.name}
              </span>
            )}

            {/* Overdue Badge */}
            {isOverdue && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500 text-white flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {vi.tasks.overdueNotice}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              'text-sm font-semibold text-slate-900 dark:text-white leading-snug break-words',
              isCompleted && 'line-through text-slate-500 dark:text-slate-400'
            )}
          >
            {task.title}
          </h3>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
              {task.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            {/* Deadline */}
            {task.deadline && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : isDueToday
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : ''
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                {deadlineStr}
              </span>
            )}

            {/* Estimated time */}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {task.estimatedMinutes}m
              </span>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                {task.tags.slice(0, 2).join(', ')}
                {task.tags.length > 2 ? ` +${task.tags.length - 2}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
