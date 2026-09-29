import type { BaseEntity } from './index'

// === M4: Hub luyện thi & Phân tích lỗ hổng kiến thức ===

export type QuestionType = 'single' | 'multiple' | 'numerical'

export interface QuestionOption {
  id: string
  text: string
}

export interface Question extends BaseEntity {
  subjectId: string
  topicId?: string
  type: QuestionType
  prompt: string
  options?: QuestionOption[]
  correctAnswer: string | string[] // id của option hoặc số
  explanation: string
  difficulty: 1 | 2 | 3 | 4 | 5
  year?: number
  source?: string
}

export interface ExamConfig {
  title: string
  subjectId: string
  topicIds?: string[]
  questionCount: number
  durationMinutes: number
  difficulty?: 'all' | 'easy' | 'medium' | 'hard'
}

export interface ExamAnswerRecord {
  questionId: string
  userAnswer?: string | string[]
  isCorrect: boolean
}

export interface TopicGapAnalysis {
  topicId: string
  topicName: string
  total: number
  correct: number
  percent: number
  status: 'good' | 'average' | 'weak' // < 60% là weak
}

export interface ExamAttempt extends BaseEntity {
  title: string
  subjectId: string
  totalQuestions: number
  correctCount: number
  score: number // Thang điểm 10
  durationSeconds: number
  timeSpentSeconds: number
  completedAt: Date
  answers: ExamAnswerRecord[]
  topicBreakdown: TopicGapAnalysis[]
}

export interface StoredExamSession extends BaseEntity {
  title: string
  subjectId: string
  questions: Question[]
  currentQIndex: number
  userAnswers: Record<string, string | string[]>
  flaggedQuestionIds: string[]
  durationSeconds: number
  startedAt: Date
  expiresAt: Date
  isSubmitted: boolean
}

// === M5: Máy tính công thức & Giải bài tập từng bước ===

export type FormulaCategory = 'math' | 'physics' | 'electronics' | 'custom'

export interface FormulaVariable {
  symbol: string
  name: string
  unit: string
  defaultValue?: number
}

export interface Formula extends BaseEntity {
  name: string
  category: FormulaCategory
  latex: string
  description: string
  variables: FormulaVariable[]
  expression: string // Biểu thức tính cho mathjs (vd: "U / R")
  resultSymbol: string
  resultUnit: string
  stepsExplanation?: string[]
}

export interface CalcHistoryItem {
  id: string
  expression: string
  result: string
  createdAt: Date
}
