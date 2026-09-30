import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { studySessionRepo, taskRepo, subjectRepo } from '@/db/repositories'
import { playChime } from '@/services/soundService'
import { vi } from '@/i18n/vi'
import { cn } from '@/lib/utils'
import type { Task, Subject, StudySession, FocusMode } from '@/types'
import { toast } from 'sonner'

type PomodoroStage = 'work' | 'shortBreak' | 'longBreak'
type TimerStatus = 'idle' | 'running' | 'paused'

interface StoredFocusState {
  mode: FocusMode
  stage: PomodoroStage
  status: TimerStatus
  targetEndTime: number | null
  remainingSeconds: number
  startedAt: number | null
  elapsedSeconds: number
  selectedSubjectId: string
  selectedTaskId: string
  pomodoroCount: number
  customMinutes: number
}

const STORAGE_KEY = 'study_os_focus_state_v1'

const POMODORO_DURATIONS: Record<PomodoroStage, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

export function FocusPage() {
  // Load persisted state or defaults
  const [mode, setMode] = useState<FocusMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).mode ?? 'pomodoro'
    } catch {}
    return 'pomodoro'
  })

  const [stage, setStage] = useState<PomodoroStage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).stage ?? 'work'
    } catch {}
    return 'work'
  })

  const [status, setStatus] = useState<TimerStatus>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).status ?? 'idle'
    } catch {}
    return 'idle'
  })

  const [targetEndTime, setTargetEndTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).targetEndTime ?? null
    } catch {}
    return null
  })

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.status === 'running' && parsed.targetEndTime) {
          const diff = Math.max(0, Math.ceil((parsed.targetEndTime - Date.now()) / 1000))
          return diff
        }
        return parsed.remainingSeconds ?? POMODORO_DURATIONS.work
      }
    } catch {}
    return POMODORO_DURATIONS.work
  })

  const [startedAt, setStartedAt] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).startedAt ?? null
    } catch {}
    return null
  })

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).elapsedSeconds ?? 0
    } catch {}
    return 0
  })

  const [customMinutes, setCustomMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).customMinutes ?? 30
    } catch {}
    return 30
  })

  const [pomodoroCount, setPomodoroCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).pomodoroCount ?? 0
    } catch {}
    return 0
  })

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).selectedSubjectId ?? ''
    } catch {}
    return ''
  })

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved).selectedTaskId ?? ''
    } catch {}
    return ''
  })

  // Reference lists
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0)

  // Map for fast lookup
  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach(s => map.set(s.id, s))
    return map
  }, [subjects])

  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>()
    tasks.forEach(t => map.set(t.id, t))
    return map
  }, [tasks])

  // Sync to localStorage
  useEffect(() => {
    const state: StoredFocusState = {
      mode,
      stage,
      status,
      targetEndTime,
      remainingSeconds,
      startedAt,
      elapsedSeconds,
      selectedSubjectId,
      selectedTaskId,
      pomodoroCount,
      customMinutes,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [
    mode,
    stage,
    status,
    targetEndTime,
    remainingSeconds,
    startedAt,
    elapsedSeconds,
    selectedSubjectId,
    selectedTaskId,
    pomodoroCount,
    customMinutes,
  ])

  // Load database metadata
  const loadMetadata = useCallback(async () => {
    try {
      const [allTasks, allSubjects, recents, todayMins] = await Promise.all([
        taskRepo.getAll(),
        subjectRepo.getAll(),
        studySessionRepo.getRecent(5),
        studySessionRepo.getTodayTotalMinutes(),
      ])
      setTasks(allTasks.filter(t => t.status !== 'completed' && t.status !== 'archived'))
      setSubjects(allSubjects)
      setRecentSessions(recents)
      setTodayFocusMinutes(todayMins)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  // Complete session callback
  const handleSessionComplete = useCallback(async () => {
    playChime()

    const sessionDuration =
      mode === 'pomodoro'
        ? stage === 'work'
          ? 25
          : stage === 'shortBreak'
          ? 5
          : 15
        : mode === 'custom'
        ? customMinutes
        : Math.round(elapsedSeconds / 60)

    // Save only study work sessions
    if (mode === 'custom' || (mode === 'pomodoro' && stage === 'work') || mode === 'stopwatch') {
      try {
        await studySessionRepo.create({
          mode,
          durationMinutes: sessionDuration,
          startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - sessionDuration * 60000),
          completedAt: new Date(),
          subjectId: selectedSubjectId || undefined,
          taskId: selectedTaskId || undefined,
          tags: ['focus'],
        })
        toast.success(vi.focus.sessionCompletedNotice)
        loadMetadata()
      } catch (e) {
        console.error(e)
      }
    }

    // Advance Pomodoro stage
    if (mode === 'pomodoro') {
      if (stage === 'work') {
        const nextCount = pomodoroCount + 1
        setPomodoroCount(nextCount)
        if (nextCount % 4 === 0) {
          setStage('longBreak')
          setRemainingSeconds(POMODORO_DURATIONS.longBreak)
          toast.info('Đã hoàn thành 4 chu kỳ! Hãy nghỉ dài 15 phút.')
        } else {
          setStage('shortBreak')
          setRemainingSeconds(POMODORO_DURATIONS.shortBreak)
          toast.info('Tuyệt vời! Nghỉ ngắn 5 phút nào.')
        }
      } else {
        setStage('work')
        setRemainingSeconds(POMODORO_DURATIONS.work)
        toast.info('Hết giờ nghỉ! Sẵn sàng cho chu kỳ tập trung mới.')
      }
      setStatus('idle')
      setTargetEndTime(null)
      setStartedAt(null)
    } else {
      setStatus('idle')
      setTargetEndTime(null)
      setStartedAt(null)
      if (mode === 'custom') {
        setRemainingSeconds(customMinutes * 60)
      }
    }
  }, [
    mode,
    stage,
    customMinutes,
    elapsedSeconds,
    startedAt,
    selectedSubjectId,
    selectedTaskId,
    pomodoroCount,
    loadMetadata,
  ])

  // Timer Ticking Loop
  const handleSessionCompleteRef = useRef(handleSessionComplete)
  handleSessionCompleteRef.current = handleSessionComplete

  useEffect(() => {
    if (status !== 'running') return

    const timer = setInterval(() => {
      if (mode === 'stopwatch') {
        if (startedAt) {
          setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
        }
      } else {
        // Countdown
        if (targetEndTime) {
          const diff = Math.ceil((targetEndTime - Date.now()) / 1000)
          if (diff <= 0) {
            setRemainingSeconds(0)
            clearInterval(timer)
            handleSessionCompleteRef.current()
          } else {
            setRemainingSeconds(diff)
          }
        }
      }
    }, 250)

    return () => clearInterval(timer)
  }, [status, mode, targetEndTime, startedAt])

  // Controls
  function handleStart() {
    const now = Date.now()
    setStartedAt(now)
    setStatus('running')

    if (mode === 'stopwatch') {
      setStartedAt(now - elapsedSeconds * 1000)
    } else {
      const target = now + remainingSeconds * 1000
      setTargetEndTime(target)
    }
  }

  function handlePause() {
    setStatus('paused')
    setTargetEndTime(null)
  }

  function handleReset() {
    setStatus('idle')
    setTargetEndTime(null)
    setStartedAt(null)
    setElapsedSeconds(0)

    if (mode === 'pomodoro') {
      setRemainingSeconds(POMODORO_DURATIONS[stage])
    } else if (mode === 'custom') {
      setRemainingSeconds(customMinutes * 60)
    }
  }

  function handleSkip() {
    if (mode === 'pomodoro') {
      if (stage === 'work') {
        setStage('shortBreak')
        setRemainingSeconds(POMODORO_DURATIONS.shortBreak)
      } else {
        setStage('work')
        setRemainingSeconds(POMODORO_DURATIONS.work)
      }
      setStatus('idle')
      setTargetEndTime(null)
    }
  }

  function handleSwitchMode(newMode: FocusMode) {
    setMode(newMode)
    setStatus('idle')
    setTargetEndTime(null)
    setStartedAt(null)
    setElapsedSeconds(0)

    if (newMode === 'pomodoro') {
      setStage('work')
      setRemainingSeconds(POMODORO_DURATIONS.work)
    } else if (newMode === 'custom') {
      setRemainingSeconds(customMinutes * 60)
    }
  }

  function handleCustomMinutesChange(mins: number) {
    const clean = Math.max(1, Math.min(180, mins))
    setCustomMinutes(clean)
    if (mode === 'custom' && status === 'idle') {
      setRemainingSeconds(clean * 60)
    }
  }

  // Format time strings
  const formattedTime = useMemo(() => {
    if (mode === 'stopwatch') {
      const h = Math.floor(elapsedSeconds / 3600)
      const m = Math.floor((elapsedSeconds % 3600) / 60)
      const s = elapsedSeconds % 60
      return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m
        .toString()
        .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const m = Math.floor(remainingSeconds / 60)
    const s = remainingSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [mode, elapsedSeconds, remainingSeconds])

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (mode === 'stopwatch') return 100
    const total =
      mode === 'pomodoro'
        ? POMODORO_DURATIONS[stage]
        : customMinutes * 60
    return Math.min(100, Math.max(0, ((total - remainingSeconds) / total) * 100))
  }, [mode, stage, customMinutes, remainingSeconds])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-dark-bg p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Timer className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              {vi.focus.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {vi.focus.subtitle}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-dark-surface p-1 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm">
            {(['pomodoro', 'custom', 'stopwatch'] as FocusMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => handleSwitchMode(m)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition',
                  mode === m
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
                aria-label={`Chế độ ${m}`}
              >
                {vi.focus.modes[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Timer Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-lg flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Stage Indicator for Pomodoro */}
          {mode === 'pomodoro' && (
            <div className="flex items-center gap-2 mb-6">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                  stage === 'work'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                )}
              >
                {vi.focus.pomodoroStages[stage]}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • Chu kỳ {pomodoroCount % 4 + 1}/4
              </span>
            </div>
          )}

          {/* Main Digital Clock Display */}
          <div className="relative my-4 flex flex-col items-center justify-center">
            {/* Circular progress bar SVG */}
            <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className="stroke-slate-100 dark:stroke-dark-border fill-transparent"
                strokeWidth="10"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                className={cn(
                  'fill-transparent transition-all duration-300 stroke-linecap-round',
                  stage === 'work' || mode === 'custom'
                    ? 'stroke-purple-600 dark:stroke-purple-400'
                    : 'stroke-emerald-500 dark:stroke-emerald-400'
                )}
                strokeWidth="10"
                strokeDasharray="800"
                strokeDashoffset={800 - (800 * progressPercent) / 100}
              />
            </svg>

            {/* Time text centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {formattedTime}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                {status === 'running' ? 'Đang chạy' : status === 'paused' ? 'Tạm dừng' : 'Sẵn sàng'}
              </span>
            </div>
          </div>

          {/* Custom Duration Slider (if custom mode & idle) */}
          {mode === 'custom' && status === 'idle' && (
            <div className="flex items-center gap-3 my-4">
              <span className="text-xs font-semibold text-slate-500">Thời gian:</span>
              {[15, 25, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleCustomMinutesChange(mins)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition',
                    customMinutes === mins
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300'
                  )}
                  aria-label={`Đặt ${mins} phút`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            {status === 'running' ? (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition"
                aria-label={vi.focus.pause}
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>{vi.focus.pause}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-lg shadow-purple-500/25 transition hover:scale-105"
                aria-label={vi.focus.start}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{status === 'paused' ? vi.focus.resume : vi.focus.start}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-2xl border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition"
              aria-label={vi.focus.reset}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {mode === 'pomodoro' && (
              <button
                type="button"
                onClick={handleSkip}
                className="p-3 rounded-2xl border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition"
                aria-label={vi.focus.skip}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Association Pickers (Subject & Task) */}
          <div className="w-full max-w-lg mt-8 pt-6 border-t border-slate-100 dark:border-dark-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {vi.focus.associatedSubject}
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200"
                aria-label={vi.focus.associatedSubject}
              >
                <option value="">-- {vi.focus.noSubject} --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {vi.focus.associatedTask}
              </label>
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200"
                aria-label={vi.focus.associatedTask}
              >
                <option value="">-- {vi.focus.noTask} --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats & Recent Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today stats */}
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Tiến độ hôm nay</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {todayFocusMinutes} <span className="text-sm font-semibold text-slate-500">phút</span>
            </div>
            <p className="text-xs text-slate-500">
              {pomodoroCount > 0 ? `Đã xong ${pomodoroCount} chu kỳ Pomodoro` : 'Bắt đầu phiên học đầu tiên nào!'}
            </p>
          </div>

          {/* Recent sessions */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              {vi.focus.recentSessions}
            </h2>

            {recentSessions.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                Chưa có phiên học nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map(session => {
                  const subject = session.subjectId ? subjectsMap.get(session.subjectId) : undefined
                  const task = session.taskId ? tasksMap.get(session.taskId) : undefined

                  return (
                    <div
                      key={session.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {session.durationMinutes} phút ({session.mode})
                          </span>
                          {task && (
                            <span className="text-slate-500 ml-1.5 truncate">
                              • {task.title}
                            </span>
                          )}
                        </div>
                      </div>

                      {subject && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: `${subject.color}15`,
                            color: subject.color,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
