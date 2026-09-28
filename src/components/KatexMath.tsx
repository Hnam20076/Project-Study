import React, { useMemo } from 'react'
import katex from 'katex'

interface KatexMathProps {
  math: string
  block?: boolean
  className?: string
}

export const KatexMath: React.FC<KatexMathProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    if (!math || !math.trim()) return ''
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      })
    } catch (err) {
      console.warn('KaTeX render error:', err)
      return `<span class="text-rose-500 font-mono text-xs">[Lỗi công thức: ${math}]</span>`
    }
  }, [math, block])

  if (!html) return null

  return (
    <span
      className={`katex-render inline-block ${block ? 'my-2 block overflow-x-auto text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
