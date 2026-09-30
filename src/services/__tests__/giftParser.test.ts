import { describe, it, expect } from 'vitest'
import { parseGIFT, exportToGIFT } from '../giftParser'
import type { Question } from '@/types'

describe('GIFT Format Parser and Exporter', () => {
  it('parses single-choice GIFT question with explanation', () => {
    const giftText = `
::Định luật Ohm:: Trong mạch điện một chiều thuần trở, cường độ dòng điện $I$ được tính bằng công thức nào? {
  =$I = \\frac{U}{R}$
  ~$I = U \\cdot R$
  ~$I = \\frac{R}{U}$ #Áp dụng định luật Ohm: I = U/R
}
`
    const parsed = parseGIFT(giftText, 'sub-elec')
    expect(parsed).toHaveLength(1)
    const q = parsed[0]
    expect(q.type).toBe('single')
    expect(q.prompt).toContain('cường độ dòng điện $I$')
    expect(q.options).toHaveLength(3)
    expect(q.explanation).toContain('định luật Ohm')
    expect(q.correctAnswer).toBe(q.options?.[0].id)
  })

  it('parses numerical GIFT question', () => {
    const giftText = `
::Điện trở tương đương:: Cho 2 điện trở $R_1 = 4\\Omega$, $R_2 = 6\\Omega$ mắc song song. Điện trở tương đương là bao nhiêu $\\Omega$? {#2.4 #Tích chia tổng: 4*6/(4+6) = 2.4}
`
    const parsed = parseGIFT(giftText, 'sub-elec')
    expect(parsed).toHaveLength(1)
    const q = parsed[0]
    expect(q.type).toBe('numerical')
    expect(q.correctAnswer).toBe('2.4')
    expect(q.explanation).toContain('2.4')
  })

  it('exports questions to GIFT format and round-trips correctly', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        subjectId: 'sub-elec',
        type: 'single',
        prompt: 'Đơn vị của điện dung là gì?',
        options: [
          { id: 'opt1', text: 'Farad (F)' },
          { id: 'opt2', text: 'Henry (H)' },
          { id: 'opt3', text: 'Ohm ($\\Omega$)' },
        ],
        correctAnswer: 'opt1',
        explanation: 'Farad là đơn vị đo điện dung.',
        difficulty: 1,
        tags: ['Linh kiện'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const exported = exportToGIFT(questions)
    expect(exported).toContain('::Linh kiện::')
    expect(exported).toContain('=Farad (F)')
    expect(exported).toContain('~Henry (H)')

    const reimported = parseGIFT(exported, 'sub-elec')
    expect(reimported).toHaveLength(1)
    expect(reimported[0].prompt).toBe('Đơn vị của điện dung là gì?')
  })
})
