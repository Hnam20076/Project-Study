import { v4 as uuidv4 } from 'uuid'
import type { Question, QuestionOption, QuestionType } from '@/types'

/**
 * Phân tích cú pháp GIFT (Moodle Quiz Format) sang danh sách câu hỏi Question
 */
export function parseGIFT(text: string, defaultSubjectId: string, defaultTopicId?: string): Question[] {
  const questions: Question[] = []
  const cleanedText = text
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith('//'))
    .join('\n')

  const blocks = cleanedText
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(b => b.length > 0)

  for (const block of blocks) {
    let title = ''
    let body = block

    // Trích xuất tiêu đề nếu có dạng ::Tiêu đề::
    const titleMatch = body.match(/^::(.*?)::\s*/)
    if (titleMatch) {
      title = titleMatch[1].trim()
      body = body.slice(titleMatch[0].length).trim()
    }

    // Tìm cặp ngoặc nhọn { ... } của GIFT (dùng thuật toán ngoặc cân bằng để tránh nhầm KaTeX { })
    const lastBrace = body.lastIndexOf('}')
    if (lastBrace === -1) continue

    let depth = 0
    let firstBrace = -1
    for (let i = lastBrace; i >= 0; i--) {
      if (body[i] === '}') depth++
      else if (body[i] === '{') {
        depth--
        if (depth === 0) {
          firstBrace = i
          break
        }
      }
    }
    if (firstBrace === -1) continue

    const prompt = body.slice(0, firstBrace).trim()
    const answerContent = body.slice(firstBrace + 1, lastBrace).trim()

    let type: QuestionType = 'single'
    const options: QuestionOption[] = []
    let correctAnswer: string | string[] = ''
    let explanation = ''

    // Kiểm tra câu hỏi điền số (bắt đầu bằng # bên trong {})
    if (answerContent.startsWith('#')) {
      type = 'numerical'
      const numParts = answerContent.slice(1).split('#')
      correctAnswer = numParts[0].trim()
      if (numParts.length > 1) {
        explanation = numParts.slice(1).join('#').trim()
      }
    } else {
      // Phân tách các phương án (hỗ trợ công thức LaTeX có chứa dấu = bên trong)
      const lines = answerContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const rawOptions: { isCorrect: boolean; text: string; feedback?: string }[] = []
      let currentChoice: { isCorrect: boolean; text: string; feedback?: string } | null = null

      for (const line of lines) {
        if (line.startsWith('=') || line.startsWith('~')) {
          if (currentChoice) rawOptions.push(currentChoice)
          const isCorrect = line.startsWith('=')
          const rest = line.slice(1).trim()
          const hashIdx = rest.indexOf('#')
          let optText = rest
          let fb: string | undefined = undefined
          if (hashIdx !== -1) {
            optText = rest.slice(0, hashIdx).trim()
            fb = rest.slice(hashIdx + 1).trim()
          }
          currentChoice = {
            isCorrect,
            text: optText,
            feedback: fb,
          }
        } else if (currentChoice) {
          currentChoice.text += ' ' + line
        }
      }
      if (currentChoice) rawOptions.push(currentChoice)

      // Fallback nếu người dùng viết tất cả trên 1 dòng
      if (rawOptions.length === 0) {
        const tokenRegex = /(?:^|\s+)([=~])((?:(?!\s+[=~]).)+)/g
        let tMatch: RegExpExecArray | null
        while ((tMatch = tokenRegex.exec(answerContent)) !== null) {
          const isCorrect = tMatch[1] === '='
          const raw = tMatch[2].trim()
          const hashIdx = raw.indexOf('#')
          let optText = raw
          let fb: string | undefined = undefined
          if (hashIdx !== -1) {
            optText = raw.slice(0, hashIdx).trim()
            fb = raw.slice(hashIdx + 1).trim()
          }
          rawOptions.push({ isCorrect, text: optText, feedback: fb })
        }
      }

      const correctIds: string[] = []
      for (const rawOpt of rawOptions) {
        let optText = rawOpt.text
        if (rawOpt.feedback && !explanation) {
          explanation = rawOpt.feedback
        }

        // Kiểm tra trọng số phần trăm %50%
        const percentMatch = optText.match(/^%(-?\d+(?:\.\d+)?)%(.*)$/)
        let percent = rawOpt.isCorrect ? 100 : 0
        if (percentMatch) {
          percent = parseFloat(percentMatch[1])
          optText = percentMatch[2].trim()
        }

        const optId = uuidv4()
        options.push({ id: optId, text: optText })

        if (rawOpt.isCorrect || percent > 0) {
          correctIds.push(optId)
        }
      }

      if (correctIds.length > 1) {
        type = 'multiple'
        correctAnswer = correctIds
      } else {
        type = 'single'
        correctAnswer = correctIds[0] || (options[0]?.id ?? '')
      }
    }

    if (prompt && (options.length > 0 || type === 'numerical')) {
      questions.push({
        id: uuidv4(),
        subjectId: defaultSubjectId,
        topicId: defaultTopicId,
        type,
        prompt: prompt || title,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanation: explanation || 'Không có giải thích',
        difficulty: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: title ? [title] : [],
      })
    }
  }

  return questions
}

/**
 * Xuất danh sách câu hỏi sang định dạng văn bản GIFT
 */
export function exportToGIFT(questions: Question[]): string {
  return questions
    .map(q => {
      const titleTag = q.tags && q.tags.length > 0 ? `::${q.tags[0]}:: ` : ''

      if (q.type === 'numerical') {
        const exp = q.explanation ? ` #${q.explanation}` : ''
        return `${titleTag}${q.prompt} {#${q.correctAnswer}${exp}}`
      }

      const optionsStr = (q.options || [])
        .map(opt => {
          const isCorrect = Array.isArray(q.correctAnswer)
            ? q.correctAnswer.includes(opt.id)
            : q.correctAnswer === opt.id

          return `${isCorrect ? '=' : '~'}${opt.text}`
        })
        .join('\n  ')

      const exp = q.explanation ? ` #${q.explanation}` : ''
      return `${titleTag}${q.prompt} {\n  ${optionsStr}${exp}\n}`
    })
    .join('\n\n')
}
