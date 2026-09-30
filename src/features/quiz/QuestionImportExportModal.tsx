import React, { useState } from 'react'
import { vi } from '@/i18n/vi'
import { parseGIFT, exportToGIFT } from '@/services/giftParser'
import { questionRepo } from '@/db/repositories'
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Question, Subject } from '@/types'

interface QuestionImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  currentSubjectId: string
  allQuestions: Question[]
}

export const QuestionImportExportModal: React.FC<QuestionImportExportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  currentSubjectId,
  allQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [importFormat, setImportFormat] = useState<'gift' | 'json'>('gift')
  const [targetSubjectId, setTargetSubjectId] = useState<string>(
    currentSubjectId !== 'all' ? currentSubjectId : subjects[0]?.id || ''
  )
  const [inputText, setInputText] = useState<string>('')
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([])
  const [isImporting, setIsImporting] = useState<boolean>(false)

  if (!isOpen) return null

  // Mẫu GIFT gợi ý
  const giftTemplate = `// Câu hỏi 1: Trắc nghiệm 1 đáp án đúng
::Định luật Ohm:: Trong đoạn mạch thuần trở, công thức nào đúng? {
  =$I = \\frac{U}{R}$
  ~$I = U \\cdot R$
  ~$I = \\frac{R}{U}$ #Theo định luật Ohm I = U/R
}

// Câu hỏi 2: Câu hỏi điền số
::Điện trở tương đương:: Điện trở $R_1=4\\Omega, R_2=6\\Omega$ mắc song song thì $R_{td}$ bằng bao nhiêu $\\Omega$? {#2.4 #Tích chia tổng: 4*6/(4+6) = 2.4}
`

  const handleParse = (text: string) => {
    setInputText(text)
    if (!text.trim()) {
      setParsedQuestions([])
      return
    }

    try {
      if (importFormat === 'gift') {
        const parsed = parseGIFT(text, targetSubjectId)
        setParsedQuestions(parsed)
      } else {
        const json = JSON.parse(text)
        if (Array.isArray(json)) {
          setParsedQuestions(json)
        } else {
          setParsedQuestions([])
        }
      }
    } catch {
      setParsedQuestions([])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = evt => {
      const content = evt.target?.result as string
      if (file.name.endsWith('.json')) {
        setImportFormat('json')
      } else {
        setImportFormat('gift')
      }
      handleParse(content)
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (parsedQuestions.length === 0) return
    setIsImporting(true)
    try {
      let count = 0
      for (const q of parsedQuestions) {
        await questionRepo.create({
          subjectId: targetSubjectId,
          topicId: q.topicId,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || 3,
          tags: q.tags || [],
        })
        count++
      }
      toast.success(`${vi.quiz.importSuccess}: ${count} câu hỏi!`)
      onClose()
    } catch {
      toast.error('Có lỗi xảy ra khi lưu câu hỏi vào ngân hàng!')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = (format: 'gift' | 'json') => {
    const questionsToExport = currentSubjectId === 'all'
      ? allQuestions
      : allQuestions.filter(q => q.subjectId === currentSubjectId)

    if (questionsToExport.length === 0) {
      toast.warning('Không có câu hỏi nào để xuất!')
      return
    }

    let fileContent = ''
    let mimeType = 'text/plain'
    let filename = `questions_${currentSubjectId}_${Date.now()}`

    if (format === 'gift') {
      fileContent = exportToGIFT(questionsToExport)
      filename += '.gift'
    } else {
      fileContent = JSON.stringify(questionsToExport, null, 2)
      mimeType = 'application/json'
      filename += '.json'
    }

    const blob = new Blob([fileContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Đã xuất thành công ${questionsToExport.length} câu hỏi!`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-border"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeTab === 'import' ? vi.quiz.importQuestions : vi.quiz.exportQuestions}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-muted"
            aria-label={vi.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-dark-border px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {vi.quiz.importQuestions}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {vi.quiz.exportQuestions}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'import' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Môn học đích */}
                <div>
                  <label htmlFor="import-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nhập vào môn học:
                  </label>
                  <select
                    id="import-subject"
                    value={targetSubjectId}
                    onChange={e => {
                      setTargetSubjectId(e.target.value)
                      handleParse(inputText)
                    }}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-slate-900 dark:text-white"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Định dạng */}
                <div>
                  <label htmlFor="import-format" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Định dạng file:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImportFormat('gift')
                        handleParse(inputText)
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        importFormat === 'gift'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-slate-300 dark:border-dark-border text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      GIFT (Moodle)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFormat('json')
                        handleParse(inputText)
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        importFormat === 'json'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-slate-300 dark:border-dark-border text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Textarea nhập liệu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="import-text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dán nội dung câu hỏi hoặc tải file:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleParse(giftTemplate)}
                      className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Xem mẫu GIFT</span>
                    </button>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-primary-600 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Tải file</span>
                      <input
                        type="file"
                        accept=".gift,.txt,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <textarea
                  id="import-text"
                  rows={8}
                  value={inputText}
                  onChange={e => handleParse(e.target.value)}
                  placeholder="Dán nội dung GIFT hoặc JSON vào đây..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 dark:border-dark-border rounded-lg bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              {/* Thống kê parse được */}
              {inputText.trim() && (
                <div className="p-3 rounded-lg flex items-center gap-2 text-xs bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                  {parsedQuestions.length > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">
                        Đã nhận diện hợp lệ: <strong>{parsedQuestions.length}</strong> câu hỏi
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-700 dark:text-amber-400">
                        Chưa tìm thấy câu hỏi hợp lệ theo định dạng {importFormat.toUpperCase()}!
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted rounded-lg"
                  aria-label={vi.common.cancel}
                >
                  {vi.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedQuestions.length === 0 || isImporting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Nhập câu hỏi vào ngân hàng"
                >
                  {isImporting ? 'Đang lưu...' : `Nhập ${parsedQuestions.length} câu hỏi`}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Phạm vi xuất câu hỏi:
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  {currentSubjectId === 'all'
                    ? `Tất cả môn học (${allQuestions.length} câu hỏi)`
                    : `${subjects.find(s => s.id === currentSubjectId)?.name || 'Môn học'} (${
                        allQuestions.filter(q => q.subjectId === currentSubjectId).length
                      } câu hỏi)`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleExport('gift')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-dark-border hover:border-primary-500 bg-white dark:bg-dark-surface hover:shadow-md transition-all text-left group"
                  aria-label="Xuất định dạng GIFT"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary-600">
                      Định dạng GIFT (.gift)
                    </span>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chuẩn Moodle Quiz, tương thích với hầu hết hệ thống LMS của các trường đại học.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-dark-border hover:border-primary-500 bg-white dark:bg-dark-surface hover:shadow-md transition-all text-left group"
                  aria-label="Xuất định dạng JSON"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary-600">
                      Định dạng JSON (.json)
                    </span>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cấu trúc dữ liệu đầy đủ của Study OS để sao lưu và chia sẻ ngân hàng câu hỏi.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
