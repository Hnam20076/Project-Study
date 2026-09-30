import { useState, useEffect } from 'react'
import { X, Trash2, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react'
import { taskRepo, subjectRepo, topicRepo, linkRepo } from '@/db/repositories'
import { db } from '@/db/database'
import { vi } from '@/i18n/vi'
import type { Task, Subject, Topic, TaskPriority, TaskStatus, EntityType, Link } from '@/types'
import { toast } from 'sonner'

interface Props {
  task: Task | null
  defaultStatus?: TaskStatus
  onClose: () => void
  onSaved: (task: Task) => void
  onDeleted?: (id: string) => void
}

export function TaskModal({ task, defaultStatus = 'todo', onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!task

  // Form state
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [subjectId, setSubjectId] = useState(task?.subjectId ?? '')
  const [topicId, setTopicId] = useState(task?.topicId ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus)
  const [deadline, setDeadline] = useState(
    task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimatedMinutes)
  const [actualMinutes, setActualMinutes] = useState<number | undefined>(task?.actualMinutes)
  const [tagsStr, setTagsStr] = useState(task?.tags?.join(', ') ?? '')

  // Data lists
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [links, setLinks] = useState<Link[]>([])

  // Linking state
  const [showAddLink, setShowAddLink] = useState(false)
  const [linkTargetType, setLinkTargetType] = useState<EntityType>('note')
  const [availableTargets, setAvailableTargets] = useState<{ id: string; title: string }[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState('')

  // Load subjects and links
  useEffect(() => {
    subjectRepo.getAll().then(setSubjects).catch(console.error)
    if (task?.id) {
      loadLinks(task.id)
    }
  }, [task?.id])

  // Load topics when subjectId changes
  useEffect(() => {
    if (subjectId) {
      topicRepo.getBySubject(subjectId).then(setTopics).catch(console.error)
    } else {
      setTopics([])
      setTopicId('')
    }
  }, [subjectId])

  // Load available target entities for linking
  useEffect(() => {
    if (!showAddLink) return
    async function loadTargets() {
      try {
        if (linkTargetType === 'note') {
          const pages = await db.pages.toArray()
          setAvailableTargets(pages.map(p => ({ id: p.id, title: p.title || vi.common.untitled })))
        } else if (linkTargetType === 'mindmap') {
          const maps = await db.mindmaps.toArray()
          setAvailableTargets(maps.map(m => ({ id: m.id, title: m.name })))
        } else if (linkTargetType === 'question') {
          const qs = await db.questions.toArray()
          setAvailableTargets(qs.map(q => ({ id: q.id, title: q.prompt.slice(0, 50) + '...' })))
        } else if (linkTargetType === 'formula') {
          const fs = await db.formulas.toArray()
          setAvailableTargets(fs.map(f => ({ id: f.id, title: f.name })))
        } else if (linkTargetType === 'knowledge_node') {
          const kns = await db.knowledgeNodes.toArray()
          setAvailableTargets(kns.map(k => ({ id: k.id, title: k.title })))
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadTargets()
  }, [showAddLink, linkTargetType])

  async function loadLinks(taskId: string) {
    try {
      const fromLinks = await linkRepo.getLinksFrom(taskId)
      const toLinks = await linkRepo.getLinksTo(taskId)
      setLinks([...fromLinks, ...toLinks])
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddLink() {
    if (!task?.id || !selectedTargetId) return
    try {
      const target = availableTargets.find(t => t.id === selectedTargetId)
      await linkRepo.create({
        fromType: 'task',
        fromId: task.id,
        toType: linkTargetType,
        toId: selectedTargetId,
        kind: 'related',
        label: target?.title,
      })
      await loadLinks(task.id)
      setShowAddLink(false)
      setSelectedTargetId('')
      toast.success(vi.toast.saved)
    } catch (e) {
      toast.error(vi.errors.saveFailed)
      console.error(e)
    }
  }

  async function handleDeleteLink(linkId: string) {
    try {
      await linkRepo.delete(linkId)
      if (task?.id) {
        await loadLinks(task.id)
      }
      toast.success(vi.toast.deleted)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error(vi.errors.invalidData)
      return
    }

    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      subjectId: subjectId || undefined,
      topicId: topicId || undefined,
      priority,
      status,
      deadline: deadline ? new Date(deadline) : undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      actualMinutes: actualMinutes ? Number(actualMinutes) : undefined,
      tags,
    }

    try {
      if (isEdit && task) {
        await taskRepo.update(task.id, payload)
        const updated = await taskRepo.getById(task.id)
        if (updated) onSaved(updated)
        toast.success(vi.toast.saved)
      } else {
        const created = await taskRepo.create(payload)
        onSaved(created)
        toast.success(vi.toast.created)
      }
      onClose()
    } catch (err) {
      toast.error(vi.errors.saveFailed)
      console.error(err)
    }
  }

  async function handleDelete() {
    if (!task) return
    const confirmed = window.confirm(vi.tasks.deleteConfirm)
    if (!confirmed) return
    try {
      await taskRepo.delete(task.id)
      if (onDeleted) onDeleted(task.id)
      toast.success(vi.toast.deleted)
      onClose()
    } catch (err) {
      toast.error(vi.errors.deleteFailed)
      console.error(err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-border flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? vi.tasks.editTask : vi.tasks.addTask}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? vi.tasks.editTask : vi.tasks.addTask}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={vi.common.close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {vi.tasks.fields.title} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={vi.tasks.fields.titlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              aria-label={vi.tasks.fields.title}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {vi.tasks.fields.description}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={vi.tasks.fields.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition resize-none text-sm"
              aria-label={vi.tasks.fields.description}
            />
          </div>

          {/* Môn học & Chủ đề */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.subject}
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm"
                aria-label={vi.tasks.fields.subject}
              >
                <option value="">-- {vi.common.none} --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.topic}
              </label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                disabled={!subjectId || topics.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm disabled:opacity-50"
                aria-label={vi.tasks.fields.topic}
              >
                <option value="">-- {vi.common.none} --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mức độ ưu tiên & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.priority}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm"
                aria-label={vi.tasks.fields.priority}
              >
                <option value="low">{vi.tasks.priority.low}</option>
                <option value="medium">{vi.tasks.priority.medium}</option>
                <option value="high">{vi.tasks.priority.high}</option>
                <option value="urgent">{vi.tasks.priority.urgent}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.status}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm"
                aria-label={vi.tasks.fields.status}
              >
                <option value="todo">{vi.tasks.status.todo}</option>
                <option value="in_progress">{vi.tasks.status.in_progress}</option>
                <option value="completed">{vi.tasks.status.completed}</option>
                <option value="archived">{vi.tasks.status.archived}</option>
              </select>
            </div>
          </div>

          {/* Hạn chót, Thời gian dự kiến & Thực tế */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.deadline}
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-xs"
                aria-label={vi.tasks.fields.deadline}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.estimatedMinutes}
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes ?? ''}
                onChange={e => setEstimatedMinutes(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="60"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-xs"
                aria-label={vi.tasks.fields.estimatedMinutes}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {vi.tasks.fields.actualMinutes}
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={actualMinutes ?? ''}
                onChange={e => setActualMinutes(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="45"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-xs"
                aria-label={vi.tasks.fields.actualMinutes}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {vi.tasks.fields.tags}
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder={vi.tasks.fields.tagsPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm"
              aria-label={vi.tasks.fields.tags}
            />
          </div>

          {/* Liên kết chéo (Cross-module Links) */}
          {isEdit && (
            <div className="pt-2 border-t border-slate-200 dark:border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-primary-500" />
                  {vi.tasks.linksCount.replace('{count}', String(links.length))}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddLink(!showAddLink)}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  aria-label="Thêm liên kết với module khác"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm liên kết
                </button>
              </div>

              {/* Add link form */}
              {showAddLink && (
                <div className="p-3 mb-3 bg-slate-50 dark:bg-dark-border/30 rounded-xl space-y-2 border border-slate-200 dark:border-dark-border">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={linkTargetType}
                      onChange={e => setLinkTargetType(e.target.value as EntityType)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                      aria-label="Loại đối tượng liên kết"
                    >
                      <option value="note">Ghi chú</option>
                      <option value="mindmap">Sơ đồ tư duy</option>
                      <option value="question">Câu hỏi</option>
                      <option value="formula">Công thức</option>
                      <option value="knowledge_node">Tri thức</option>
                    </select>

                    <select
                      value={selectedTargetId}
                      onChange={e => setSelectedTargetId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                      aria-label="Chọn đối tượng liên kết"
                    >
                      <option value="">-- Chọn --</option>
                      {availableTargets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLink(false)}
                      className="px-2.5 py-1 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-border"
                      aria-label="Hủy thêm liên kết"
                    >
                      {vi.common.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTargetId}
                      onClick={handleAddLink}
                      className="px-2.5 py-1 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      aria-label="Lưu liên kết"
                    >
                      {vi.common.add}
                    </button>
                  </div>
                </div>
              )}

              {/* Links list */}
              {links.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {links.map(l => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-bg text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold capitalize text-primary-600 dark:text-primary-400">
                          [{l.toType}]:
                        </span>
                        {l.label || l.toId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(l.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded"
                        aria-label="Xóa liên kết"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-dark-border flex items-center justify-between">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-medium transition flex items-center gap-1.5"
                aria-label={vi.common.delete}
              >
                <Trash2 className="w-4 h-4" />
                {vi.common.delete}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-border text-sm font-medium transition"
                aria-label={vi.common.cancel}
              >
                {vi.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-md shadow-primary-500/20 transition"
                aria-label={vi.common.save}
              >
                {vi.common.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
