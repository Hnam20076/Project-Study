import { useState, useEffect } from 'react'
import { X, CheckSquare, BookOpen, GraduationCap } from 'lucide-react'
import { taskRepo, pageRepo, notebookRepo, sectionRepo, flashcardRepo, subjectRepo } from '@/db/repositories'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Subject, Notebook, TaskPriority } from '@/types'
import { toast } from 'sonner'

type CaptureType = 'task' | 'note' | 'flashcard'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function QuickCaptureModal({ isOpen, onClose }: Props) {
  const [activeType, setActiveType] = useState<CaptureType>('task')

  // Shared
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notebooks, setNotebooks] = useState<Notebook[]>([])

  // Task form
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskSubjectId, setTaskSubjectId] = useState('')

  // Note form
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteNotebookId, setNoteNotebookId] = useState('')

  // Flashcard form
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [fcSubjectId, setFcSubjectId] = useState('')

  useEffect(() => {
    if (!isOpen) return
    subjectRepo.getAll().then(setSubjects).catch(console.error)
    notebookRepo.getAll().then(nb => {
      setNotebooks(nb)
      if (nb.length > 0 && !noteNotebookId) {
        setNoteNotebookId(nb[0].id)
      }
    }).catch(console.error)
  }, [isOpen, noteNotebookId])

  // Reset forms on open
  useEffect(() => {
    if (isOpen) {
      setTaskTitle('')
      setNoteTitle('')
      setNoteContent('')
      setFcFront('')
      setFcBack('')
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return

    try {
      await taskRepo.create({
        title: taskTitle.trim(),
        priority: taskPriority,
        status: 'todo',
        deadline: taskDeadline ? new Date(taskDeadline) : undefined,
        subjectId: taskSubjectId || undefined,
        tags: ['quick-capture'],
      })
      toast.success(vi.quickCapture.createdTaskSuccess)
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(vi.errors.saveFailed)
    }
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteTitle.trim()) return

    try {
      let targetNotebookId = noteNotebookId
      let targetSectionId = ''

      // Ensure notebook exists
      if (!targetNotebookId) {
        const defaultNb = await notebookRepo.create({
          name: 'Sổ tay chung',
          color: '#6366f1',
          order: 0,
          tags: [],
        })
        targetNotebookId = defaultNb.id
      }

      // Ensure section exists in notebook
      const sections = await sectionRepo.getByNotebook(targetNotebookId)
      if (sections.length > 0) {
        targetSectionId = sections[0].id
      } else {
        const newSec = await sectionRepo.create({
          name: 'Ghi chép nhanh',
          notebookId: targetNotebookId,
          order: 0,
          tags: [],
        })
        targetSectionId = newSec.id
      }

      await pageRepo.create({
        title: noteTitle.trim(),
        content: noteContent.trim() ? `<p>${noteContent.trim()}</p>` : '<p></p>',
        notebookId: targetNotebookId,
        sectionId: targetSectionId,
        order: 0,
        tags: ['quick-capture'],
      })

      toast.success(vi.quickCapture.createdNoteSuccess)
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(vi.errors.saveFailed)
    }
  }

  async function handleCreateFlashcard(e: React.FormEvent) {
    e.preventDefault()
    if (!fcFront.trim() || !fcBack.trim()) return

    try {
      await flashcardRepo.create({
        front: fcFront.trim(),
        back: fcBack.trim(),
        subjectId: fcSubjectId || (subjects[0]?.id ?? 'sub-general'),
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
        tags: ['quick-capture'],
      })
      toast.success(vi.quickCapture.createdFlashcardSuccess)
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(vi.errors.saveFailed)
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
        className="w-full max-w-lg bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-slate-200 dark:border-dark-border flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={vi.quickCapture.modalTitle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {vi.quickCapture.modalTitle}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-dark-border text-slate-500">
              Alt+N
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={vi.common.close}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="p-4 border-b border-slate-100 dark:border-dark-border">
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-dark-bg p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveType('task')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition',
                activeType === 'task'
                  ? 'bg-white dark:bg-dark-surface text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
              aria-label="Tạo nhanh Nhiệm vụ"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{vi.quickCapture.typeTask}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('note')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition',
                activeType === 'note'
                  ? 'bg-white dark:bg-dark-surface text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
              aria-label="Tạo nhanh Ghi chú"
            >
              <BookOpen className="w-4 h-4" />
              <span>{vi.quickCapture.typeNote}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('flashcard')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition',
                activeType === 'flashcard'
                  ? 'bg-white dark:bg-dark-surface text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
              aria-label="Tạo nhanh Flashcard"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{vi.quickCapture.typeFlashcard}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Forms */}
        <div className="p-6">
          {/* TASK FORM */}
          {activeType === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.tasks.fields.title} *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Nhập nhiệm vụ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm"
                  aria-label={vi.tasks.fields.title}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {vi.tasks.fields.priority}
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                    aria-label={vi.tasks.fields.priority}
                  >
                    <option value="low">{vi.tasks.priority.low}</option>
                    <option value="medium">{vi.tasks.priority.medium}</option>
                    <option value="high">{vi.tasks.priority.high}</option>
                    <option value="urgent">{vi.tasks.priority.urgent}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {vi.tasks.fields.subject}
                  </label>
                  <select
                    value={taskSubjectId}
                    onChange={e => setTaskSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                    aria-label={vi.tasks.fields.subject}
                  >
                    <option value="">-- {vi.common.none} --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.tasks.fields.deadline}
                </label>
                <input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={e => setTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                  aria-label={vi.tasks.fields.deadline}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  aria-label={vi.common.cancel}
                >
                  {vi.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20"
                  aria-label="Lưu nhiệm vụ"
                >
                  {vi.common.create}
                </button>
              </div>
            </form>
          )}

          {/* NOTE FORM */}
          {activeType === 'note' && (
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.quickCapture.noteTitle} *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Tiêu đề ghi chú..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-sm"
                  aria-label={vi.quickCapture.noteTitle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.quickCapture.noteNotebook}
                </label>
                <select
                  value={noteNotebookId}
                  onChange={e => setNoteNotebookId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                  aria-label={vi.quickCapture.noteNotebook}
                >
                  {notebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}
                    </option>
                  ))}
                  {notebooks.length === 0 && <option value="">Sổ tay mặc định</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.quickCapture.noteContent}
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Nội dung ý tưởng ngắn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs resize-none"
                  aria-label={vi.quickCapture.noteContent}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  aria-label={vi.common.cancel}
                >
                  {vi.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                  aria-label="Lưu ghi chú"
                >
                  {vi.common.create}
                </button>
              </div>
            </form>
          )}

          {/* FLASHCARD FORM */}
          {activeType === 'flashcard' && (
            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.quickCapture.flashcardFront} *
                </label>
                <textarea
                  rows={2}
                  autoFocus
                  required
                  value={fcFront}
                  onChange={e => setFcFront(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc thuật ngữ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs resize-none"
                  aria-label={vi.quickCapture.flashcardFront}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.quickCapture.flashcardBack} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={fcBack}
                  onChange={e => setFcBack(e.target.value)}
                  placeholder="Nhập câu trả lời hoặc định nghĩa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs resize-none"
                  aria-label={vi.quickCapture.flashcardBack}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {vi.tasks.fields.subject}
                </label>
                <select
                  value={fcSubjectId}
                  onChange={e => setFcSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-xs"
                  aria-label={vi.tasks.fields.subject}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {subjects.length === 0 && <option value="">Môn học mặc định</option>}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  aria-label={vi.common.cancel}
                >
                  {vi.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
                  aria-label="Lưu flashcard"
                >
                  {vi.common.create}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
