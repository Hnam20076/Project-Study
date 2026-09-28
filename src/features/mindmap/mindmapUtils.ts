import type { MindMap, MindMapNodeData } from '@/types'
import { downloadJSON } from '@/db/exportImport'
import { notebookRepo, sectionRepo, pageRepo } from '@/db/repositories'

/**
 * Xuất dữ liệu sơ đồ tư duy ra file JSON
 */
export function exportMindMapJSON(map: MindMap): void {
  const filename = `${map.name.replace(/[/\\?%*:|"<>]/g, '-')}.mindmap.json`
  downloadJSON(map, filename)
}

/**
 * Sinh chuỗi SVG đại diện cho sơ đồ tư duy
 */
export function generateMindMapSVG(map: MindMap): string {
  const nodes = map.nodes
  const edges = map.edges

  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><text x="50" y="100" fill="#999">Sơ đồ trống</text></svg>`
  }

  const nodeMap = new Map<string, MindMapNodeData>()
  nodes.forEach(n => nodeMap.set(n.id, n))

  const NODE_W = 160
  const NODE_H = 48

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(n => {
    if (n.x < minX) minX = n.x
    if (n.y < minY) minY = n.y
    if (n.x + NODE_W > maxX) maxX = n.x + NODE_W
    if (n.y + NODE_H > maxY) maxY = n.y + NODE_H
  })

  const padding = 60
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding
  const width = Math.max(maxX - minX, 400)
  const height = Math.max(maxY - minY, 300)

  // Vẽ các đường nối
  const edgesSvg = edges
    .map(e => {
      const src = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (!src || !tgt) return ''

      const x1 = src.x + NODE_W
      const y1 = src.y + NODE_H / 2
      const x2 = tgt.x
      const y2 = tgt.y + NODE_H / 2
      const dx = (x2 - x1) * 0.5
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

      return `<path d="${d}" fill="none" stroke="${src.color || '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" opacity="0.85" />`
    })
    .join('\n')

  // Vẽ các nodes
  const nodesSvg = nodes
    .map(n => {
      const label = n.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const formula = n.formulaLatex ? ' [f(x)]' : ''
      return `
      <g transform="translate(${n.x}, ${n.y})">
        <rect width="${NODE_W}" height="${NODE_H}" rx="10" fill="#ffffff" stroke="${n.color || '#6366f1'}" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
        <rect x="0" y="0" width="6" height="${NODE_H}" rx="3" fill="${n.color || '#6366f1'}" />
        <text x="14" y="28" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#1e293b">
          ${label.length > 18 ? label.slice(0, 16) + '...' : label}${formula}
        </text>
      </g>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f8fafc" />
  <g>${edgesSvg}</g>
  <g>${nodesSvg}</g>
</svg>`
}

/**
 * Tải về file SVG
 */
export function exportMindMapSVG(map: MindMap): void {
  const svgContent = generateMindMapSVG(map)
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${map.name.replace(/[/\\?%*:|"<>]/g, '-')}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Tải về file PNG vẽ từ SVG
 */
export function exportMindMapPNG(map: MindMap): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgContent = generateMindMapSVG(map)
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width * 2
        canvas.height = img.height * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          return reject(new Error('Canvas context not available'))
        }
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        const pngUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `${map.name.replace(/[/\\?%*:|"<>]/g, '-')}.png`
        a.click()
        resolve()
      }

      img.onerror = err => {
        URL.revokeObjectURL(url)
        reject(err)
      }

      img.src = url
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Chuyển đổi toàn bộ MindMap thành danh sách checklist trong một Ghi chú mới
 */
export async function convertMindMapToNotePage(map: MindMap): Promise<string> {
  // Lấy hoặc tạo notebook mặc định
  let notebooks = await notebookRepo.getAll()
  let notebookId: string
  if (notebooks.length === 0) {
    const nb = await notebookRepo.create({
      name: 'Sổ tay tổng hợp',
      color: '#6366f1',
      order: 1,
      tags: ['sơ đồ'],
    })
    notebookId = nb.id
  } else {
    notebookId = notebooks[0].id
  }

  // Lấy hoặc tạo section
  let sections = await sectionRepo.getByNotebook(notebookId)
  let sectionId: string
  if (sections.length === 0) {
    const sec = await sectionRepo.create({
      name: 'Sơ đồ tư duy',
      notebookId,
      order: 1,
      tags: [],
    })
    sectionId = sec.id
  } else {
    sectionId = sections[0].id
  }

  // Xây dựng cây phân cấp nội dung checklist
  const parentMap = new Map<string, string>()
  const childrenMap = new Map<string, MindMapNodeData[]>()

  map.nodes.forEach(n => {
    childrenMap.set(n.id, [])
    if (n.parentId) parentMap.set(n.id, n.parentId)
  })

  map.edges.forEach(e => {
    if (!parentMap.has(e.target)) parentMap.set(e.target, e.source)
  })

  map.nodes.forEach(n => {
    const pId = parentMap.get(n.id)
    if (pId && childrenMap.has(pId)) {
      childrenMap.get(pId)!.push(n)
    }
  })

  const rootNodes = map.nodes.filter(n => !parentMap.has(n.id))

  function renderTreeToHtml(nodes: MindMapNodeData[], level = 0): string {
    if (nodes.length === 0) return ''
    let html = '<ul data-type="taskList">\n'
    nodes.forEach(n => {
      let subContent = ''
      if (n.notes) {
        subContent += `<p><em>${n.notes}</em></p>`
      }
      if (n.formulaLatex) {
        subContent += `<p><code>${n.formulaLatex}</code></p>`
      }
      if (n.checkItems && n.checkItems.length > 0) {
        subContent += '<ul data-type="taskList">'
        n.checkItems.forEach(ci => {
          subContent += `<li data-checked="${ci.checked ? 'true' : 'false'}"><label><input type="checkbox"${ci.checked ? ' checked="checked"' : ''}><span>${ci.text}</span></label></li>`
        })
        subContent += '</ul>'
      }

      const children = childrenMap.get(n.id) || []
      const childHtml = renderTreeToHtml(children, level + 1)

      html += `<li data-checked="false">
        <label><input type="checkbox"><span><strong>${n.label}</strong></span></label>
        ${subContent}
        ${childHtml}
      </li>\n`
    })
    html += '</ul>\n'
    return html
  }

  const content = `<h1>📋 Checklist: ${map.name}</h1>
<p><em>Chuyển đổi từ sơ đồ tư duy ngày ${new Date().toLocaleDateString('vi-VN')}</em></p>
<hr />
${renderTreeToHtml(rootNodes.length > 0 ? rootNodes : map.nodes)}`

  const maxOrder = await pageRepo.getMaxOrder(sectionId)
  const newPage = await pageRepo.create({
    title: `Checklist: ${map.name}`,
    content,
    sectionId,
    notebookId,
    order: maxOrder + 1,
    tags: ['checklist', 'sơ đồ tư duy', ...map.tags],
    subjectId: map.subjectId,
    topicId: map.topicId,
  })

  return newPage.id
}
