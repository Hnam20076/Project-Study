import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { questionRepo, examAttemptRepo, subjectRepo, topicRepo } from '@/db/repositories'
import { QuestionModal } from './QuestionModal'
import { KnowledgeGapReport } from './KnowledgeGapReport'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { KatexMath } from '@/components/KatexMath'
import { vi } from '@/i18n/vi'
import {
  GraduationCap,
  Plus,
  Play,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { seedDemoData } from '@/db/seed'
import { toast } from 'sonner'
import type {
  Question,
  ExamAttempt,
  Topic,
  TopicGapAnalysis,
  ExamAnswerRecord,
} from '@/types'

type TabMode = 'exam' | 'bank' | 'history'

export const QuizContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('exam')

  const questions = useLiveQuery(() => questionRepo.getAll(), []) ?? []
  const subjects = useLiveQuery(() => subjectRepo.getAll(), []) ?? []
  const topics = useLiveQuery(() => topicRepo.getAll(), []) ?? []
  const attempts = useLiveQuery(() => examAttemptRepo.getAll(), []) ?? []

  // === State Quản lý thi ===
  const [isExamActive, setIsExamActive] = useState(false)
  const [examCompleted, setExamCompleted] = useState(false)
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0) // giây
  const [examTitle, setExamTitle] = useState('')
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null)

  // Cấu hình đề thi
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [selectedNumQuestions, setSelectedNumQuestions] = useState<number>(5)
  const [selectedDuration, setSelectedDuration] = useState<number>(10) // phút
  const [isReSeeding, setIsReSeeding] = useState(false)

  // Ngân hàng câu hỏi filters
  const [bankSearch, setBankSearch] = useState('')
  const [bankSubjectId, setBankSubjectId] = useState<string>('all')
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)

  // Đảm bảo selectedSubjectId có giá trị mặc định hợp lệ
  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedSubjectId('all')
    }
  }, [selectedSubjectId])

  // Danh sách câu hỏi có sẵn theo môn học đã chọn
  const availableQuestions = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === 'all') {
      return questions
    }
    return questions.filter(q => q.subjectId === selectedSubjectId)
  }, [questions, selectedSubjectId])

  // Nạp lại bộ câu hỏi mẫu khi cơ sở dữ liệu trống
  const handleReSeed = async () => {
    try {
      setIsReSeeding(true)
      await seedDemoData()
      toast.success('Đã nạp thành công bộ câu hỏi mẫu vào ngân hàng đề!')
    } catch (err) {
      console.error(err)
      toast.error('Không thể nạp dữ liệu: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsReSeeding(false)
    }
  }

  // Timer đếm ngược khi đang thi
  useEffect(() => {
    if (!isExamActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.warning(vi.quiz.timeUp)
          handleSubmitExam()
          return 0
        }
        if (prev === 300) {
          toast.warning('Còn 5 phút! Hãy kiểm tra lại các câu phân vân.')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExamActive, timeLeft])

  // Bắt đầu làm bài thi
  const handleStartExam = () => {
    try {
      if (availableQuestions.length === 0) {
        toast.error('Chưa có câu hỏi nào cho môn học này! Vui lòng chọn môn khác hoặc nạp bộ câu hỏi.')
        return
      }

      // Trộn ngẫu nhiên câu hỏi (Fisher-Yates)
      const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, Math.min(selectedNumQuestions, availableQuestions.length))

      const sub = subjects.find(s => s.id === selectedSubjectId)
      const title = selectedSubjectId === 'all' || !sub
        ? `Đề luyện thi: Tất cả môn học (${selected.length} câu)`
        : `Đề luyện thi: ${sub.name} (${selected.length} câu)`

      setExamQuestions(selected)
      setExamTitle(title)
      setCurrentQIndex(0)
      setUserAnswers({})
      setFlaggedQuestions(new Set())
      setTimeLeft(selectedDuration * 60)
      setIsExamActive(true)
      setExamCompleted(false)
      setCurrentAttempt(null)
    } catch (err) {
      console.error('Lỗi khi bắt đầu thi:', err)
      toast.error('Không thể tạo đề thi: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Nộp bài thi
  const handleSubmitExam = async () => {
    try {
      setIsExamActive(false)
      setExamCompleted(true)

      // Tính điểm và phân tích lỗ hổng theo topic
      let correctTotal = 0
      const records: ExamAnswerRecord[] = []
      const topicStats: Record<string, { total: number; correct: number }> = {}

      examQuestions.forEach(q => {
        const userAns = userAnswers[q.id]
        const isCorrect = userAns !== undefined && userAns === q.correctAnswer
        if (isCorrect) correctTotal++

        records.push({
          questionId: q.id,
          userAnswer: userAns,
          isCorrect,
        })

        const tId = q.topicId || 'unknown'
        if (!topicStats[tId]) {
          topicStats[tId] = { total: 0, correct: 0 }
        }
        topicStats[tId].total++
        if (isCorrect) topicStats[tId].correct++
      })

      const topicMap = new Map<string, Topic>()
      topics.forEach(t => topicMap.set(t.id, t))

      const breakdown: TopicGapAnalysis[] = Object.entries(topicStats).map(([tId, stat]) => {
        const percent = (stat.correct / stat.total) * 100
        const topicName = tId === 'unknown' ? 'Tổng hợp / Chưa phân loại' : topicMap.get(tId)?.name || 'Chủ đề'
        let status: 'good' | 'average' | 'weak' = 'good'
        if (percent < 60) status = 'weak'
        else if (percent < 80) status = 'average'

        return {
          topicId: tId,
          topicName,
          total: stat.total,
          correct: stat.correct,
          percent,
          status,
        }
      })

      const score = examQuestions.length > 0 ? (correctTotal / examQuestions.length) * 10 : 0
      const durationSeconds = selectedDuration * 60
      const timeSpentSeconds = Math.max(0, durationSeconds - timeLeft)

      const attempt = await examAttemptRepo.create({
        title: examTitle,
        subjectId: selectedSubjectId || 'all',
        totalQuestions: examQuestions.length,
        correctCount: correctTotal,
        score,
        durationSeconds,
        timeSpentSeconds,
        completedAt: new Date(),
        answers: records,
        topicBreakdown: breakdown,
        tags: ['luyện thi'],
      })

      setCurrentAttempt(attempt)
      toast.success('Đã nộp bài và chấm điểm xong!')
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err)
      toast.error('Không thể lưu kết quả bài thi: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Đánh dấu câu phân vân
  const toggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  // Định dạng thời gian mm:ss
  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Lọc câu hỏi trong tab Ngân hàng
  const filteredBankQuestions = useMemo(() => {
    return questions.filter(q => {
      if (bankSubjectId !== 'all' && q.subjectId !== bankSubjectId) return false
      if (bankSearch.trim()) {
        const query = bankSearch.toLowerCase().trim()
        const matchPrompt = q.prompt.toLowerCase().includes(query)
        const matchTag = q.tags.some(t => t.toLowerCase().includes(query))
        if (!matchPrompt && !matchTag) return false
      }
      return true
    })
  }, [questions, bankSubjectId, bankSearch])

  const currentQ = examQuestions[currentQIndex]

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Top Header & Tab Navigation */}
      <header className="px-4 py-2.5 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <GraduationCap className="w-5 h-5 flex-shrink-0" />
          <h1 className="font-bold text-base text-slate-800 dark:text-slate-100 hidden sm:inline">
            {vi.quiz.title}
          </h1>
        </div>

        {/* Tab switchers (ẩn khi đang thi) */}
        {!isExamActive && (
          <div className="flex items-center bg-slate-100 dark:bg-dark-muted p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('exam')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'exam'
                  ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {vi.quiz.takeExam}
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'bank'
                  ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {vi.quiz.questionBank} ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {vi.quiz.history} ({attempts.length})
            </button>
          </div>
        )}

        {isExamActive && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-full ${
              timeLeft < 300 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 dark:bg-dark-muted text-slate-700 dark:text-slate-200'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimeRemaining(timeLeft)}</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm(vi.quiz.confirmSubmit)) {
                  handleSubmitExam()
                }
              }}
              className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700"
            >
              {vi.quiz.submitExam}
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">
        {/* === TAB 1: PHÒNG THI & KẾT QUẢ === */}
        {activeTab === 'exam' && (
          <div>
            {/* Chế độ chưa bắt đầu thi */}
            {!isExamActive && !examCompleted && (
              <div className="card p-6 max-w-xl mx-auto space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {vi.quiz.createExam}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tùy chọn môn học và thời lượng để bắt đầu buổi luyện thi tập trung
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {vi.common.subject}
                    </label>
                    <select
                      className="input text-xs"
                      value={selectedSubjectId}
                      onChange={e => setSelectedSubjectId(e.target.value)}
                    >
                      <option value="all">
                        Tất cả môn học ({questions.length} câu)
                      </option>
                      {subjects.map(s => {
                        const count = questions.filter(q => q.subjectId === s.id).length
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code}) — {count} câu
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {availableQuestions.length === 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span>Môn học này hiện chưa có câu hỏi nào. Hãy chọn <strong>"Tất cả môn học"</strong> hoặc chuyển sang tab </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('bank')}
                          className="font-bold underline hover:opacity-80"
                        >
                          Ngân hàng câu hỏi
                        </button>
                        <span> để tạo câu hỏi mới.</span>
                      </div>
                    </div>
                  )}

                  {questions.length === 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between gap-2">
                      <span>Chưa có câu hỏi nào trong hệ thống?</span>
                      <button
                        type="button"
                        onClick={handleReSeed}
                        disabled={isReSeeding}
                        className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isReSeeding ? 'animate-spin' : ''}`} />
                        <span>Nạp câu hỏi mẫu</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {vi.quiz.numQuestions}
                      </label>
                      <select
                        className="input text-xs"
                        value={selectedNumQuestions}
                        onChange={e => setSelectedNumQuestions(Number(e.target.value))}
                      >
                        <option value={5}>5 câu (Khởi động)</option>
                        <option value={10}>10 câu (Tiêu chuẩn)</option>
                        <option value={15}>15 câu (Luyện tập sâu)</option>
                        <option value={20}>20 câu (Đề thi thử đầy đủ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {vi.quiz.duration}
                      </label>
                      <select
                        className="input text-xs"
                        value={selectedDuration}
                        onChange={e => setSelectedDuration(Number(e.target.value))}
                      >
                        <option value={5}>5 phút</option>
                        <option value={10}>10 phút</option>
                        <option value={15}>15 phút</option>
                        <option value={20}>20 phút</option>
                        <option value={30}>30 phút</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleStartExam}
                    disabled={availableQuestions.length === 0}
                    className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{vi.quiz.startExam} {availableQuestions.length > 0 ? `(${availableQuestions.length} câu sẵn sàng)` : ''}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chế độ đang làm bài thi */}
            {isExamActive && currentQ && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Khu vực câu hỏi */}
                <div className="lg:col-span-3 card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                    <span className="font-bold text-sm text-primary-600 dark:text-primary-400">
                      Câu {currentQIndex + 1} / {examQuestions.length}
                    </span>
                    <button
                      onClick={() => toggleFlag(currentQ.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        flaggedQuestions.has(currentQ.id)
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-muted'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flaggedQuestions.has(currentQ.id) ? vi.quiz.unflagQuestion : vi.quiz.flagQuestion}</span>
                    </button>
                  </div>

                  {/* Đề bài */}
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    <KatexMath math={currentQ.prompt} />
                  </div>

                  {/* Options */}
                  {currentQ.options && currentQ.options.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      {currentQ.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx)
                        const isSelected = userAnswers[currentQ.id] === opt.id

                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              setUserAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))
                            }
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-xs ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 font-semibold ring-1 ring-primary-500'
                                : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-muted text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isSelected ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-dark-border text-slate-600'
                            }`}>
                              {letter}
                            </span>
                            <div className="flex-1 mt-0.5">
                              <KatexMath math={opt.text} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Numerical input if numerical */}
                  {currentQ.type === 'numerical' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nhập đáp án số:
                      </label>
                      <input
                        type="text"
                        className="input text-xs font-mono max-w-xs"
                        value={userAnswers[currentQ.id] || ''}
                        onChange={e =>
                          setUserAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))
                        }
                        placeholder="Ví dụ: 8"
                      />
                    </div>
                  )}

                  {/* Bottom navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
                    <button
                      onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQIndex === 0}
                      className="btn-secondary text-xs flex items-center gap-1 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{vi.common.previous}</span>
                    </button>

                    <button
                      onClick={() =>
                        setCurrentQIndex(prev => Math.min(examQuestions.length - 1, prev + 1))
                      }
                      disabled={currentQIndex === examQuestions.length - 1}
                      className="btn-primary text-xs flex items-center gap-1 disabled:opacity-40"
                    >
                      <span>{vi.common.next}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bảng câu hỏi bên cạnh (Question Palette Grid) */}
                <div className="card p-4 space-y-3 h-fit">
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {vi.quiz.questionList}
                  </h3>

                  <div className="grid grid-cols-5 gap-2">
                    {examQuestions.map((q, idx) => {
                      const isAnswered = userAnswers[q.id] !== undefined
                      const isFlagged = flaggedQuestions.has(q.id)
                      const isCurrent = idx === currentQIndex

                      let bgClass = 'bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300'
                      if (isAnswered) bgClass = 'bg-primary-600 text-white font-bold'
                      if (isFlagged) bgClass = 'bg-amber-400 text-slate-900 font-bold'

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs transition-all relative ${bgClass} ${
                            isCurrent ? 'ring-2 ring-offset-2 ring-primary-500 scale-105' : ''
                          }`}
                        >
                          <span>{idx + 1}</span>
                          {isFlagged && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-dark-border space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-600" />
                      <span>{vi.quiz.answered}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-400" />
                      <span>{vi.quiz.flagged}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-slate-200 dark:bg-dark-muted" />
                      <span>{vi.quiz.unanswered}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chế độ đã nộp bài: Báo cáo phân tích lỗ hổng & Xem lại chi tiết */}
            {examCompleted && currentAttempt && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Kết quả bài thi & Phân tích lỗ hổng
                  </h2>
                  <button
                    onClick={() => {
                      setExamCompleted(false)
                      setIsExamActive(false)
                    }}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm đề khác</span>
                  </button>
                </div>

                {/* Báo cáo lỗ hổng kiến thức */}
                <KnowledgeGapReport
                  breakdown={currentAttempt.topicBreakdown}
                  score={currentAttempt.score}
                  totalQuestions={currentAttempt.totalQuestions}
                  correctCount={currentAttempt.correctCount}
                />

                {/* Xem lại chi tiết từng câu */}
                <div className="card p-5 space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {vi.quiz.reviewAnswers} ({examQuestions.length} câu)
                  </h3>

                  <div className="space-y-4">
                    {examQuestions.map((q, idx) => {
                      const userAns = userAnswers[q.id]
                      const isCorrect = userAns === q.correctAnswer
                      const userOpt = q.options?.find(o => o.id === userAns)
                      const correctOpt = q.options?.find(o => o.id === q.correctAnswer)

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border text-xs space-y-2 ${
                            isCorrect
                              ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                              : 'border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              Câu {idx + 1}:
                            </span>
                            <span className={`flex items-center gap-1 font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" /> Đúng (+{(10 / examQuestions.length).toFixed(1)}đ)
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" /> Sai (0đ)
                                </>
                              )}
                            </span>
                          </div>

                          <div className="text-slate-800 dark:text-slate-100 font-medium">
                            <KatexMath math={q.prompt} />
                          </div>

                          {/* Đáp án bạn chọn & Đáp án đúng */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-400">
                            <div className="p-2 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border">
                              <span className="font-semibold text-slate-500">
                                {vi.quiz.yourAnswer}:{' '}
                              </span>
                              <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                                {userOpt ? userOpt.text : userAns || 'Chưa làm'}
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border">
                              <span className="font-semibold text-slate-500">
                                {vi.quiz.correctAnswer}:{' '}
                              </span>
                              <span className="text-emerald-600 font-bold">
                                {correctOpt ? correctOpt.text : String(q.correctAnswer)}
                              </span>
                            </div>
                          </div>

                          {/* Lời giải chi tiết */}
                          {q.explanation && (
                            <div className="p-3 bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-dark-border mt-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                {vi.quiz.explanation}:
                              </span>
                              <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                <KatexMath math={q.explanation} />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB 2: NGÂN HÀNG CÂU HỎI === */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            {/* Search & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi hoặc thẻ..."
                    value={bankSearch}
                    onChange={e => setBankSearch(e.target.value)}
                    className="input pl-8 py-1.5 text-xs w-full"
                  />
                </div>

                <select
                  className="input py-1.5 text-xs w-40"
                  value={bankSubjectId}
                  onChange={e => setBankSubjectId(e.target.value)}
                >
                  <option value="all">Tất cả môn học</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingQuestion(null)
                  setIsQuestionModalOpen(true)
                }}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{vi.quiz.addQuestion}</span>
              </button>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              {filteredBankQuestions.map((q, idx) => (
                <div key={q.id} className="card p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">#{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
                        Độ khó: {q.difficulty}/5
                      </span>
                      {q.isDemo && (
                        <span className="badge-demo text-[10px]">{vi.demo.badge}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingQuestion(q)
                          setIsQuestionModalOpen(true)
                        }}
                        className="p-1 text-slate-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(vi.dialog.deleteMessage)) {
                            await questionRepo.delete(q.id)
                            toast.success(vi.toast.deleted)
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    <KatexMath math={q.prompt} />
                  </div>

                  {q.options && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id}
                          className={`p-1.5 rounded-lg border text-[11px] ${
                            opt.id === q.correctAnswer
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-emerald-800 dark:text-emerald-200'
                              : 'border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                          <KatexMath math={opt.text} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {filteredBankQuestions.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {vi.quiz.noQuestions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB 3: LỊCH SỬ LÀM BÀI === */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">
              Lịch sử các lần luyện đề ({attempts.length})
            </h3>

            {attempts.map(att => (
              <div
                key={att.id}
                className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {att.title}
                  </h4>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Hoàn thành lúc: {new Date(att.completedAt).toLocaleString('vi-VN')} · Thời gian: {Math.round(att.timeSpentSeconds / 60)} phút
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-base font-extrabold ${att.score >= 8 ? 'text-emerald-500' : att.score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {att.score.toFixed(1)} / 10
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {att.correctCount}/{att.totalQuestions} câu đúng
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (window.confirm(vi.dialog.deleteMessage)) {
                        await examAttemptRepo.delete(att.id)
                        toast.success(vi.toast.deleted)
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                    title={vi.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {attempts.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                {vi.quiz.noAttempts}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Modal */}
      {isQuestionModalOpen && (
        <QuestionModal
          question={editingQuestion}
          subjects={subjects}
          topics={topics}
          onClose={() => {
            setIsQuestionModalOpen(false)
            setEditingQuestion(null)
          }}
          onSave={async (qData, id) => {
            if (id) {
              await questionRepo.update(id, qData)
              toast.success(vi.toast.updated)
            } else {
              await questionRepo.create(qData)
              toast.success(vi.toast.created)
            }
          }}
          onDelete={async id => {
            await questionRepo.delete(id)
            toast.success(vi.toast.deleted)
          }}
        />
      )}
    </div>
  )
}

export const QuizPage: React.FC = () => {
  return (
    <ErrorBoundary moduleName={vi.nav.quiz}>
      <QuizContent />
    </ErrorBoundary>
  )
}
