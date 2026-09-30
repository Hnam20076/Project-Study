import { useState, useEffect } from 'react'
import ImageExtension from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Maximize2, Trash2, Download } from 'lucide-react'
import { imageRepo } from '@/db/repositories'

export function CustomImageView({ node, deleteNode }: NodeViewProps) {
  const src = (node.attrs.src as string) || ''
  const alt = (node.attrs.alt as string) || ''
  const title = (node.attrs.title as string) || ''
  const [resolvedSrc, setResolvedSrc] = useState<string>('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let currentObjectUrl = ''
    let isCancelled = false

    if (src && src.startsWith('idb://')) {
      const imageId = src.replace('idb://', '')
      imageRepo
        .getById(imageId)
        .then((imgRecord) => {
          if (isCancelled) return
          if (imgRecord?.blob) {
            currentObjectUrl = URL.createObjectURL(imgRecord.blob)
            setResolvedSrc(currentObjectUrl)
          } else {
            setResolvedSrc('')
          }
          setLoading(false)
        })
        .catch(() => {
          if (!isCancelled) setLoading(false)
        })
    } else {
      setResolvedSrc(src)
      setLoading(false)
    }

    return () => {
      isCancelled = true
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [src])

  const handleDownload = () => {
    if (!resolvedSrc) return
    const a = document.createElement('a')
    a.href = resolvedSrc
    a.download = alt || title || 'note-image'
    a.click()
  }

  return (
    <NodeViewWrapper className="relative inline-block my-3 group max-w-full">
      {loading ? (
        <div className="w-48 h-32 bg-slate-100 dark:bg-dark-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
          Đang tải ảnh...
        </div>
      ) : resolvedSrc ? (
        <div className="relative inline-block overflow-hidden rounded-lg border border-slate-200 dark:border-dark-border group">
          <img
            src={resolvedSrc}
            alt={alt}
            title={title}
            className="max-w-full h-auto rounded block cursor-pointer transition-transform duration-200 hover:brightness-95"
            onClick={() => setIsPreviewOpen(true)}
          />

          {/* Action buttons on hover */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 backdrop-blur-sm px-1.5 py-1 rounded-md text-white shadow-md">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Phóng to"
              aria-label="Phóng to ảnh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Tải ảnh"
              aria-label="Tải ảnh về máy"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                deleteNode()
                if (src.startsWith('idb://')) {
                  const id = src.replace('idb://', '')
                  imageRepo.delete(id).catch(console.error)
                }
              }}
              className="p-1 hover:bg-rose-600/80 rounded transition-colors"
              title="Xóa ảnh"
              aria-label="Xóa ảnh"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen modal */}
          {isPreviewOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setIsPreviewOpen(false)}
            >
              <div
                className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={resolvedSrc}
                  alt={alt}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                {alt && (
                  <div className="mt-2 text-white/80 text-sm">{alt}</div>
                )}
                <div className="absolute -top-10 right-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-white hover:text-primary-300 p-1.5 rounded bg-black/50"
                    title="Tải xuống"
                    aria-label="Tải xuống ảnh"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-white hover:text-rose-400 p-1.5 rounded bg-black/50 font-bold"
                    aria-label="Đóng xem trước"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 border border-dashed border-red-300 dark:border-red-800 rounded-lg text-red-500 text-xs bg-red-50/50 dark:bg-red-950/20">
          Ảnh không tồn tại hoặc đã bị xóa
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const CustomImage = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CustomImageView)
  },
})
