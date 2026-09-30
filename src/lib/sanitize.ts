import DOMPurify from 'dompurify'

const SANITIZE_CONFIG: Record<string, any> = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
    'span', 'div', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'mark', 'del', 'ins', 'sub', 'sup'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'title', 'width', 'height', 'loading',
    'class', 'style',
    'data-latex', 'data-type', 'data-checked', 'data-id',
    'colspan', 'rowspan', 'colwidth'
  ],
  // Cho phép URL an toàn gồm idb:, blob:, data:, http, https
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|blob|data|idb):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['data-latex'],
}

/**
 * Cấu hình an toàn cho DOMPurify cho StudyOS:
 * - Hỗ trợ các giao thức src: idb://, blob:, data:, http://, https://
 * - Cho phép data-latex cho các công thức toán KaTeX
 * - Cho phép các thuộc tính cơ bản của bảng, ảnh, và TipTap extensions
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''

  if (typeof (DOMPurify as any)?.sanitize === 'function') {
    return DOMPurify.sanitize(dirty, SANITIZE_CONFIG)
  }

  if (typeof DOMPurify === 'function' && typeof window !== 'undefined') {
    return (DOMPurify as any)(window).sanitize(dirty, SANITIZE_CONFIG)
  }

  return dirty
}
