import { useState, useRef, useEffect } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import { Check, Edit2, Trash2 } from 'lucide-react'

// Mở rộng kiểu lệnh của TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineMath: {
      insertInlineMath: (latex?: string) => ReturnType
    }
    blockMath: {
      insertBlockMath: (latex?: string) => ReturnType
    }
  }
}

/**
 * Component hiển thị và chỉnh sửa công thức toán KaTeX
 */
export function MathView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const isBlock = node.type.name === 'blockMath'
  const latex = (node.attrs.latex as string) || ''
  const [isEditing, setIsEditing] = useState(!latex)
  const [draftLatex, setDraftLatex] = useState(latex)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraftLatex(latex)
  }, [latex])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isEditing])

  let previewHtml = ''
  try {
    previewHtml = katex.renderToString(draftLatex || ' ', {
      throwOnError: false,
      displayMode: isBlock,
    })
  } catch {
    previewHtml = `<span class="text-rose-500 font-mono text-xs">${draftLatex}</span>`
  }

  const handleSave = () => {
    const trimmed = draftLatex.trim()
    if (!trimmed) {
      deleteNode()
      return
    }
    updateAttributes({ latex: trimmed })
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (!latex) {
      deleteNode()
      return
    }
    setDraftLatex(latex)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      as={isBlock ? 'div' : 'span'}
      className={`math-node-wrapper ${isBlock ? 'math-block' : 'math-inline'} relative inline-block group select-none ${
        isBlock ? 'w-full my-4 text-center block' : 'mx-1 align-baseline'
      } ${selected ? 'ring-2 ring-primary-500 rounded' : ''}`}
      data-latex={latex}
    >
      {isEditing ? (
        <div
          className={`z-20 p-3 bg-white dark:bg-dark-surface border border-primary-400 dark:border-primary-600 rounded-lg shadow-xl text-left ${
            isBlock ? 'max-w-xl mx-auto' : 'absolute left-0 bottom-full mb-1 min-w-[280px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>{isBlock ? 'Khối công thức LaTeX ($$...$$)' : 'Toán inline LaTeX ($...$)'}</span>
            <span className="text-[10px] text-slate-400">Enter để lưu</span>
          </div>

          {isBlock ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draftLatex}
              onChange={(e) => setDraftLatex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSave()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
              }}
              placeholder="Nhập mã LaTeX (vd: \frac{-b \pm \sqrt{b^2-4ac}}{2a})"
              rows={3}
              className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-dark-border rounded bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draftLatex}
              onChange={(e) => setDraftLatex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
              }}
              placeholder="Nhập LaTeX (vd: E = mc^2)"
              className="w-full text-xs font-mono p-1.5 border border-slate-300 dark:border-dark-border rounded bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
            />
          )}

          {/* Live Preview */}
          <div className="mt-2 p-2 bg-slate-100/70 dark:bg-dark-bg/60 rounded border border-slate-200 dark:border-dark-border min-h-[32px] flex items-center justify-center overflow-x-auto">
            <span
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className="text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Controls */}
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={deleteNode}
              className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded flex items-center gap-1 mr-auto"
              title="Xóa công thức"
              aria-label="Xóa công thức"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted rounded"
              aria-label="Hủy sửa công thức"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded font-medium flex items-center gap-1 shadow-sm"
              aria-label="Lưu công thức"
            >
              <Check className="w-3 h-3" />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      ) : (
        <span
          className={`relative inline-block cursor-pointer transition-colors rounded px-1 py-0.5 hover:bg-primary-50 dark:hover:bg-primary-950/30 ${
            isBlock ? 'p-3 bg-slate-50/50 dark:bg-dark-surface/40 border border-slate-100 dark:border-dark-border/50' : ''
          }`}
          onClick={() => setIsEditing(true)}
          title="Nhấp để chỉnh sửa công thức"
        >
          <span
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            className={isBlock ? 'text-lg block' : 'text-base'}
          />

          {/* Hover action bar */}
          <span className="absolute -top-7 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 pointer-events-none">
            <Edit2 className="w-2.5 h-2.5" />
            <span>Sửa công thức</span>
          </span>
        </span>
      )}
    </NodeViewWrapper>
  )
}

/**
 * TipTap Node cho Inline Math ($...$)
 */
export const InlineMathNode = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: 'x',
        parseHTML: (element) => element.getAttribute('data-latex') || element.textContent || '',
        renderHTML: (attributes) => {
          return {
            'data-latex': attributes.latex,
            class: 'math-inline',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.math-inline[data-latex]',
      },
      {
        tag: 'span[data-latex]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'math-inline' }),
      HTMLAttributes['data-latex'] || '',
    ]
  },

  addCommands() {
    return {
      insertInlineMath:
        (latex = '') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView)
  },
})

/**
 * TipTap Node cho Block Math ($$...$$)
 */
export const BlockMathNode = Node.create({
  name: 'blockMath',
  group: 'block',
  inline: false,
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
        parseHTML: (element) => element.getAttribute('data-latex') || element.textContent || '',
        renderHTML: (attributes) => {
          return {
            'data-latex': attributes.latex,
            class: 'math-block',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.math-block[data-latex]',
      },
      {
        tag: 'div[data-latex]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'math-block' }),
      HTMLAttributes['data-latex'] || '',
    ]
  },

  addCommands() {
    return {
      insertBlockMath:
        (latex = '') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView)
  },
})
