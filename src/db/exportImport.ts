import { z } from 'zod'
import type { ExportData } from '@/types'
import { db } from './database'
import { dataUrlToBlob } from '@/services/noteMigration'

/**
 * Chuyển Blob thành Data URL dạng base64
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  if (!blob) return ''
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  const arrayBuffer = await blob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return `data:${blob.type || 'image/png'};base64,${base64}`
}

// Zod schema để validate dữ liệu nhập
const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tags: z.array(z.string()),
  isDemo: z.boolean().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
})

const SubjectSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  code: z.string(),
  color: z.string(),
  description: z.string().optional(),
  semester: z.string().optional(),
})

const TopicSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  subjectId: z.string(),
  description: z.string().optional(),
  order: z.number(),
})

const LinkSchema = BaseEntitySchema.extend({
  fromType: z.string(),
  fromId: z.string(),
  toType: z.string(),
  toId: z.string(),
  kind: z.string(),
  label: z.string().optional(),
})

const SemesterSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  weeksCount: z.number(),
  isCurrent: z.boolean().optional(),
})

const ScheduleSchema = BaseEntitySchema.extend({
  className: z.string().min(1),
  classCode: z.string().optional(),
  teacher: z.string().optional(),
  room: z.string().optional(),
  color: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  weeks: z.array(z.number()),
  notes: z.string().optional(),
  periodStart: z.number().min(1).max(16).optional(),
  periodEnd: z.number().min(1).max(16).optional(),
  classGroupCode: z.string().optional(),
  weekOverrides: z.record(z.coerce.number(), z.object({ room: z.string().optional() })).optional(),
})

const NotebookSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  color: z.string(),
  order: z.number(),
})

const SectionSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  notebookId: z.string(),
  color: z.string().optional(),
  order: z.number(),
})

const PageSchema = BaseEntitySchema.extend({
  title: z.string(),
  content: z.string(),
  sectionId: z.string(),
  notebookId: z.string(),
  order: z.number(),
  wordCount: z.number().optional(),
})

const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  notes: z.string().optional(),
  color: z.string(),
  collapsed: z.boolean().optional(),
  formulaLatex: z.string().optional(),
  checkItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    checked: z.boolean(),
  })).optional(),
  imageBase64: z.string().optional(),
  x: z.number(),
  y: z.number(),
  parentId: z.string().optional(),
})

const MindMapEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
})

const MindMapSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  nodes: z.array(MindMapNodeSchema),
  edges: z.array(MindMapEdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }),
})

const KnowledgeNodeSchema = BaseEntitySchema.extend({
  title: z.string().min(1),
  description: z.string(),
  formulaLatex: z.string().optional(),
  examples: z.string().optional(),
  references: z.string().optional(),
  difficulty: z.number().min(1).max(5),
  tags: z.array(z.string()),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  verified: z.boolean().optional(),
  x: z.number(),
  y: z.number(),
})

const KnowledgeEdgeSchema = z.object({
  id: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  kind: z.string(),
  label: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isDemo: z.boolean().optional(),
})

const QuestionSchema = BaseEntitySchema.extend({
  subjectId: z.string(),
  topicId: z.string().optional(),
  type: z.enum(['single', 'multiple', 'numerical']),
  prompt: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string(),
  difficulty: z.number().min(1).max(5),
  year: z.number().optional(),
  source: z.string().optional(),
})

const ExamAttemptSchema = BaseEntitySchema.extend({
  title: z.string(),
  subjectId: z.string(),
  totalQuestions: z.number(),
  correctCount: z.number(),
  score: z.number(),
  durationSeconds: z.number(),
  timeSpentSeconds: z.number(),
  completedAt: z.coerce.date(),
  answers: z.array(z.object({
    questionId: z.string(),
    userAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    isCorrect: z.boolean(),
  })),
  topicBreakdown: z.array(z.object({
    topicId: z.string(),
    topicName: z.string(),
    total: z.number(),
    correct: z.number(),
    percent: z.number(),
    status: z.enum(['good', 'average', 'weak']),
  })),
})

const FormulaSchema = BaseEntitySchema.extend({
  name: z.string(),
  category: z.enum(['math', 'physics', 'electronics', 'custom']),
  latex: z.string(),
  description: z.string(),
  variables: z.array(z.object({
    symbol: z.string(),
    name: z.string(),
    unit: z.string(),
    defaultValue: z.number().optional(),
  })),
  expression: z.string(),
  resultSymbol: z.string(),
  resultUnit: z.string(),
  stepsExplanation: z.array(z.string()).optional(),
})

const CalcHistorySchema = z.object({
  id: z.string(),
  expression: z.string(),
  result: z.string(),
  createdAt: z.coerce.date(),
})

const ComponentPinSchema = z.object({
  number: z.number(),
  name: z.string(),
  type: z.enum(['power', 'ground', 'io', 'analog', 'pwm', 'comm', 'control', 'passive']),
  description: z.string(),
  voltageMax: z.string().optional(),
  currentMax: z.string().optional(),
})

const ApplicationCircuitSchema = z.object({
  title: z.string(),
  description: z.string(),
  svgDiagram: z.string().optional(),
  schematicExplanation: z.string(),
  bom: z.array(z.object({
    componentName: z.string(),
    quantity: z.number(),
    note: z.string().optional(),
  })),
})

const ElectronicComponentSchema = BaseEntitySchema.extend({
  name: z.string(),
  code: z.string(),
  category: z.enum(['ic', 'transistor', 'diode', 'sensor', 'passive', 'module']),
  package: z.enum(['DIP-8', 'DIP-14', 'DIP-16', 'DIP-28', 'TO-92', 'TO-220', 'Module', 'Other']),
  description: z.string(),
  operatingVoltage: z.object({
    min: z.number(),
    typ: z.number().optional(),
    max: z.number(),
    unit: z.string(),
  }),
  maxCurrent: z.string().optional(),
  frequency: z.string().optional(),
  temperatureRange: z.string().optional(),
  pins: z.array(ComponentPinSchema),
  applicationCircuits: z.array(ApplicationCircuitSchema).optional(),
  datasheetUrl: z.string().optional(),
  verified: z.boolean(),
  source: z.string().optional(),
  manufacturer: z.string().optional(),
})

const FlashcardSchema = BaseEntitySchema.extend({
  subjectId: z.string(),
  topicId: z.string().optional(),
  front: z.string(),
  back: z.string(),
  explanation: z.string().optional(),
  interval: z.number(),
  repetition: z.number(),
  easeFactor: z.number(),
  nextReviewDate: z.coerce.date(),
  lastReviewDate: z.coerce.date().optional(),
  questionId: z.string().optional(),
})

const ExportDataSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  subjects: z.array(SubjectSchema),
  topics: z.array(TopicSchema),
  links: z.array(LinkSchema),
  schedules: z.array(ScheduleSchema),
  semesters: z.array(SemesterSchema).optional(),
  notebooks: z.array(NotebookSchema),
  sections: z.array(SectionSchema),
  pages: z.array(PageSchema),
  noteVersions: z.array(z.object({
    id: z.string(),
    pageId: z.string(),
    content: z.string(),
    savedAt: z.coerce.date(),
    wordCount: z.number().optional(),
  })),
  mindmaps: z.array(MindMapSchema).optional(),
  knowledgeNodes: z.array(KnowledgeNodeSchema).optional(),
  knowledgeEdges: z.array(KnowledgeEdgeSchema).optional(),
  questions: z.array(QuestionSchema).optional(),
  examAttempts: z.array(ExamAttemptSchema).optional(),
  formulas: z.array(FormulaSchema).optional(),
  calcHistory: z.array(CalcHistorySchema).optional(),
  electronicComponents: z.array(ElectronicComponentSchema).optional(),
  flashcards: z.array(FlashcardSchema).optional(),
  noteImages: z.array(z.object({
    id: z.string(),
    pageId: z.string(),
    dataUrl: z.string(),
    mimeType: z.string(),
    fileName: z.string().optional(),
    size: z.number().optional(),
    createdAt: z.string().or(z.coerce.date()),
    updatedAt: z.string().or(z.coerce.date()).optional(),
  })).optional(),
})

export const EXPORT_VERSION = 5

/**
 * Xuất toàn bộ dữ liệu ra JSON (bao gồm ảnh ghi chú dạng base64)
 */
export async function exportAllData(): Promise<ExportData> {
  const [
    subjects,
    topics,
    links,
    schedules,
    notebooks,
    sections,
    pages,
    noteVersions,
    mindmaps,
    knowledgeNodes,
    knowledgeEdges,
    questions,
    examAttempts,
    formulas,
    calcHistory,
    electronicComponents,
    semesters,
    flashcards,
    rawNoteImages,
  ] = await Promise.all([
    db.subjects.toArray(),
    db.topics.toArray(),
    db.links.toArray(),
    db.schedules.toArray(),
    db.notebooks.toArray(),
    db.sections.toArray(),
    db.pages.toArray(),
    db.noteVersions.toArray(),
    db.mindmaps.toArray(),
    db.knowledgeNodes.toArray(),
    db.knowledgeEdges.toArray(),
    db.questions.toArray(),
    db.examAttempts.toArray(),
    db.formulas.toArray(),
    db.calcHistory.toArray(),
    db.electronicComponents.toArray(),
    db.semesters.toArray(),
    db.flashcards.toArray(),
    db.noteImages.toArray(),
  ])

  // Chuyển đổi Blob thành dataUrl để serialize JSON trọn vẹn
  const exportedImages = await Promise.all(
    rawNoteImages.map(async (img) => ({
      id: img.id,
      pageId: img.pageId,
      dataUrl: await blobToDataUrl(img.blob),
      mimeType: img.mimeType,
      fileName: img.fileName,
      size: img.size || img.blob.size,
      createdAt: typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString(),
      updatedAt: img.updatedAt
        ? (typeof img.updatedAt === 'string' ? img.updatedAt : img.updatedAt.toISOString())
        : undefined,
    }))
  )

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    subjects,
    topics,
    links,
    schedules,
    semesters,
    notebooks,
    sections,
    pages,
    noteVersions,
    noteImages: exportedImages,
    mindmaps,
    knowledgeNodes,
    knowledgeEdges,
    questions,
    examAttempts,
    formulas,
    calcHistory,
    electronicComponents,
    flashcards,
  }
}

/**
 * Nhập dữ liệu từ JSON, validate bằng zod trước khi ghi
 * Tương thích ngược với các file export cũ không có noteImages
 * @throws Error nếu dữ liệu không hợp lệ
 */
export async function importAllData(raw: unknown): Promise<void> {
  // Validate
  const parsed = ExportDataSchema.parse(raw)

  // Ghi vào database trong một transaction lớn
  await db.transaction('rw', [
    db.subjects, db.topics, db.links, db.schedules,
    db.notebooks, db.sections, db.pages, db.noteVersions, db.noteImages,
    db.mindmaps, db.knowledgeNodes, db.knowledgeEdges,
    db.questions, db.examAttempts, db.formulas, db.calcHistory,
    db.electronicComponents, db.semesters, db.flashcards,
  ], async () => {
    // Xóa toàn bộ dữ liệu cũ
    await Promise.all([
      db.subjects.clear(),
      db.topics.clear(),
      db.links.clear(),
      db.schedules.clear(),
      db.notebooks.clear(),
      db.sections.clear(),
      db.pages.clear(),
      db.noteVersions.clear(),
      db.noteImages.clear(),
      db.mindmaps.clear(),
      db.knowledgeNodes.clear(),
      db.knowledgeEdges.clear(),
      db.questions.clear(),
      db.examAttempts.clear(),
      db.formulas.clear(),
      db.calcHistory.clear(),
      db.electronicComponents.clear(),
      db.semesters.clear(),
      db.flashcards.clear(),
    ])

    // Ghi dữ liệu mới
    if (parsed.subjects.length > 0) await db.subjects.bulkAdd(parsed.subjects as never[])
    if (parsed.topics.length > 0) await db.topics.bulkAdd(parsed.topics as never[])
    if (parsed.links.length > 0) await db.links.bulkAdd(parsed.links as never[])
    if (parsed.schedules.length > 0) await db.schedules.bulkAdd(parsed.schedules as never[])
    if (parsed.semesters && parsed.semesters.length > 0) await db.semesters.bulkAdd(parsed.semesters as never[])
    if (parsed.notebooks.length > 0) await db.notebooks.bulkAdd(parsed.notebooks as never[])
    if (parsed.sections.length > 0) await db.sections.bulkAdd(parsed.sections as never[])
    if (parsed.pages.length > 0) await db.pages.bulkAdd(parsed.pages as never[])
    if (parsed.noteVersions.length > 0) await db.noteVersions.bulkAdd(parsed.noteVersions as never[])
    if (parsed.mindmaps && parsed.mindmaps.length > 0) await db.mindmaps.bulkAdd(parsed.mindmaps as never[])
    if (parsed.knowledgeNodes && parsed.knowledgeNodes.length > 0) await db.knowledgeNodes.bulkAdd(parsed.knowledgeNodes as never[])
    if (parsed.knowledgeEdges && parsed.knowledgeEdges.length > 0) await db.knowledgeEdges.bulkAdd(parsed.knowledgeEdges as never[])
    if (parsed.questions && parsed.questions.length > 0) await db.questions.bulkAdd(parsed.questions as never[])
    if (parsed.examAttempts && parsed.examAttempts.length > 0) await db.examAttempts.bulkAdd(parsed.examAttempts as never[])
    if (parsed.formulas && parsed.formulas.length > 0) await db.formulas.bulkAdd(parsed.formulas as never[])
    if (parsed.calcHistory && parsed.calcHistory.length > 0) await db.calcHistory.bulkAdd(parsed.calcHistory as never[])
    if (parsed.electronicComponents && parsed.electronicComponents.length > 0) await db.electronicComponents.bulkAdd(parsed.electronicComponents as never[])
    if (parsed.flashcards && parsed.flashcards.length > 0) await db.flashcards.bulkAdd(parsed.flashcards as never[])

    // Khôi phục noteImages nếu có trong payload
    if (parsed.noteImages && parsed.noteImages.length > 0) {
      const imageRecords = parsed.noteImages.map((img) => {
        const { blob } = dataUrlToBlob(img.dataUrl)
        return {
          id: img.id,
          pageId: img.pageId,
          blob,
          mimeType: img.mimeType || blob.type,
          fileName: img.fileName,
          size: img.size || blob.size,
          createdAt: new Date(img.createdAt),
          updatedAt: img.updatedAt ? new Date(img.updatedAt) : new Date(img.createdAt),
        }
      })
      await db.noteImages.bulkAdd(imageRecords as never[])
    }
  })
}

/**
 * Tải xuống file JSON
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
