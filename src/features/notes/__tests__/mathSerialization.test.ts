import { describe, it, expect } from 'vitest'
import katex from 'katex'
import { sanitizeHTML } from '@/lib/sanitize'

describe('Math Node KaTeX & HTML Serialization', () => {
  it('KaTeX render thành công công thức inline E = mc^2', () => {
    const latex = 'E = mc^2'
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: false })
    expect(html).toContain('katex')
    expect(html).toContain('class="katex-html"')
  })

  it('KaTeX render thành công công thức block nghiệm phương trình bậc 2', () => {
    const latex = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}'
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: true })
    expect(html).toContain('katex-display')
    expect(html).toContain('sqrt')
  })

  it('sanitizeHTML bảo tồn trọn vẹn thuộc tính data-latex và class của math-inline và math-block', () => {
    const rawNote = `
      <p>Năng lượng Einstein: <span class="math-inline" data-latex="E = mc^2">E = mc^2</span></p>
      <div class="math-block" data-latex="\\int_0^\\infty e^{-x} dx = 1">\\int_0^\\infty e^{-x} dx = 1</div>
    `
    const sanitized = sanitizeHTML(rawNote)

    expect(sanitized).toContain('data-latex="E = mc^2"')
    expect(sanitized).toContain('class="math-inline"')
    expect(sanitized).toContain('class="math-block"')
    expect(sanitized).toContain('data-latex="\\int_0^\\infty e^{-x} dx = 1"')
  })

  it('KaTeX xử lý cú pháp lỗi an toàn khi throwOnError: false', () => {
    const invalidLatex = '\\frac{unclosed'
    const html = katex.renderToString(invalidLatex, { throwOnError: false })
    expect(html).toBeDefined()
    expect(typeof html).toBe('string')
  })
})
