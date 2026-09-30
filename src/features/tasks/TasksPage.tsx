import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  LayoutList,
  Kanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  BookOpen,
} from 'lucide-react'
import { taskRepo, subjectRepo, isTaskOverdue } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Task, Subject, TaskStatus } from '@/types'
import { TaskModal } from './TaskModal'
import { TaskCard } from './TaskCard'
import { toast } from 'sonner'

type ViewMode = 'list' | 'kanban'

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('todo')

  // Subjects Map for fast lookup
  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach(s => map.set(s.id, s))
    return map
  }, [subjects])

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [allTasks, allSubjects] = await Promise.all([
        taskRepo.getAll(),
        subjectRepo.getAll(),
      ])
      setTasks(allTasks)
      setSubjects(allSubjects)

      // Handle deep link ?id=...
      const deepLinkId = searchParams.get('id')
      if (deepLinkId) {
        const found = allTasks.find(t => t.id === deepLinkId)
        if (found) {
          setEditingTask(found)
          setIsModalOpen(true)
        }
      }
    } catch (e) {
      console.error(e)
      toast.error(vi.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  // Handle URL deep link change
  useEffect(() => {
    const deepLinkId = searchParams.get('id')
    if (deepLinkId && tasks.length > 0) {
      const found = tasks.find(t => t.id === deepLinkId)
      if (found) {
        setEditingTask(found)
        setIsModalOpen(true)
      }
    }
  }, [searchParams, tasks])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = t.title.toLowerCase().includes(q)
        const matchesDesc = t.description?.toLowerCase().includes(q) ?? false
        const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false
        if (!matchesTitle && !matchesDesc && !matchesTags) return false
      }

      // Subject
      if (filterSubject !== 'all' && t.subjectId !== filterSubject) {
        return false
      }

      // Priority
      if (filterPriority !== 'all' && t.priority !== filterPriority) {
        return false
      }

      // Status (only applies in list view or if filter is set)
      if (filterStatus !== 'all' && viewMode === 'list') {
        if (filterStatus === 'overdue') {
          if (!isTaskOverdue(t)) return false
        } else if (t.status !== filterStatus) {
          return false
        }
      }

      return true
    })
  }, [tasks, searchQuery, filterSubject, filterPriority, filterStatus, viewMode])

  // Overdue count
  const overdueCount = useMemo(() => {
    return tasks.filter(isTaskOverdue).length
  }, [tasks])

  // Handlers
  async function handleToggleComplete(task: Task) {
    try {
      const updated = await taskRepo.toggleComplete(task.id)
      if (updated) {
        setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
      }
    } catch (e) {
      console.error(e)
      toast.error(vi.errors.saveFailed)
    }
  }

  function handleOpenCreate(defaultStatus: TaskStatus = 'todo') {
    setEditingTask(null)
    setModalDefaultStatus(defaultStatus)
    setIsModalOpen(true)
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task)
    setIsModalOpen(true)
    setSearchParams({ id: task.id })
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setEditingTask(null)
    setSearchParams({})
  }

  function handleTaskSaved(saved: Task) {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = saved
        return copy
      }
      return [saved, ...prev]
    })
  }

  function handleTaskDeleted(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Kanban Columns
  const KANBAN_COLUMNS: { id: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'todo', label: vi.tasks.status.todo, icon: Clock, color: 'text-sky-600 dark:text-sky-400' },
    { id: 'in_progress', label: vi.tasks.status.in_progress, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400' },
    { id: 'completed', label: vi.tasks.status.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'archived', label: vi.tasks.status.archived, icon: Archive, color: 'text-slate-500 dark:text-slate-400' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-dark-bg p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {vi.tasks.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {vi.tasks.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-dark-surface p-1 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                  viewMode === 'list'
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
                aria-label={vi.tasks.viewList}
              >
                <LayoutList className="w-4 h-4" />
                <span>{vi.tasks.viewList}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                  viewMode === 'kanban'
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
                aria-label={vi.tasks.viewKanban}
              >
                <Kanban className="w-4 h-4" />
                <span>{vi.tasks.viewKanban}</span>
              </button>
            </div>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => handleOpenCreate('todo')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm shadow-md shadow-primary-500/20 transition"
              aria-label={vi.tasks.addTask}
            >
              <Plus className="w-4 h-4" />
              <span>{vi.tasks.addTask}</span>
            </button>
          </div>
        </div>

        {/* Overdue Banner */}
        {overdueCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>
                {vi.planner.overdueBanner.replace('{count}', String(overdueCount))}
              </span>
            </div>
            {viewMode === 'list' && filterStatus !== 'overdue' && (
              <button
                type="button"
                onClick={() => setFilterStatus('overdue')}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline"
                aria-label="Xem nhiệm vụ quá hạn"
              >
                Xem ngay
              </button>
            )}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-dark-surface p-3 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={vi.tasks.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label={vi.tasks.searchPlaceholder}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subject Filter */}
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={vi.tasks.filterBySubject}
            >
              <option value="all">{vi.tasks.allSubjects}</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={vi.tasks.filterByPriority}
            >
              <option value="all">{vi.tasks.allPriorities}</option>
              <option value="urgent">{vi.tasks.priority.urgent}</option>
              <option value="high">{vi.tasks.priority.high}</option>
              <option value="medium">{vi.tasks.priority.medium}</option>
              <option value="low">{vi.tasks.priority.low}</option>
            </select>

            {/* Status Filter (List View only) */}
            {viewMode === 'list' && (
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={vi.tasks.filterByStatus}
              >
                <option value="all">{vi.tasks.allStatuses}</option>
                <option value="todo">{vi.tasks.status.todo}</option>
                <option value="in_progress">{vi.tasks.status.in_progress}</option>
                <option value="completed">{vi.tasks.status.completed}</option>
                <option value="archived">{vi.tasks.status.archived}</option>
                <option value="overdue">{vi.tasks.status.overdue}</option>
              </select>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            {vi.common.loading}
          </div>
        ) : filteredTasks.length === 0 && tasks.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-dark-surface rounded-2xl border border-dashed border-slate-300 dark:border-dark-border">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {vi.tasks.empty}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              {vi.tasks.emptyDescription}
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreate('todo')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
              aria-label={vi.tasks.addTask}
            >
              <Plus className="w-4 h-4" />
              <span>{vi.tasks.addTask}</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                subjectsMap={subjectsMap}
                onToggleComplete={handleToggleComplete}
                onClick={handleOpenEdit}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500">
                Không tìm thấy nhiệm vụ nào khớp bộ lọc.
              </div>
            )}
          </div>
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {KANBAN_COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id)
              const Icon = col.icon

              return (
                <div
                  key={col.id}
                  className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-dark-surface/40 border border-slate-200 dark:border-dark-border p-3.5 space-y-3 min-h-[400px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', col.color)} />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {col.label}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-border">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreate(col.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-dark-surface transition"
                      aria-label={`Thêm nhiệm vụ vào ${col.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        subjectsMap={subjectsMap}
                        onToggleComplete={handleToggleComplete}
                        onClick={handleOpenEdit}
                      />
                    ))}

                    {colTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-xl flex items-center justify-center text-xs text-slate-400">
                        Trống
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={modalDefaultStatus}
          onClose={handleCloseModal}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  )
}
