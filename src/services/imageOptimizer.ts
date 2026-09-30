/**
 * Image Optimizer Service for StudyOS Notes
 * Resize ảnh trên Canvas với cạnh dài tối đa 1600px, nén WebP/JPEG chất lượng 0.85
 * Đảm bảo ghi chú không bị phình to bởi ảnh gốc hàng chục MB.
 */

export interface OptimizedImageResult {
  blob: Blob
  mimeType: string
  width: number
  height: number
  size: number
  fileName?: string
}

export interface OptimizeOptions {
  maxDimension?: number
  quality?: number
  fileName?: string
}

/**
 * Tính toán kích thước ảnh mục tiêu theo tỷ lệ khung hình
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension = 1600
): { targetWidth: number; targetHeight: number } {
  if (width <= 0 || height <= 0) {
    return { targetWidth: Math.max(1, width), targetHeight: Math.max(1, height) }
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { targetWidth: width, targetHeight: height }
  }

  if (width >= height) {
    const scale = maxDimension / width
    return {
      targetWidth: maxDimension,
      targetHeight: Math.max(1, Math.round(height * scale)),
    }
  } else {
    const scale = maxDimension / height
    return {
      targetWidth: Math.max(1, Math.round(width * scale)),
      targetHeight: maxDimension,
    }
  }
}

/**
 * Tối ưu hóa ảnh (resize + nén canvas)
 */
export async function optimizeImage(
  input: Blob | File,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const { maxDimension = 1600, quality = 0.85, fileName } = options
  const originalName = fileName || (input instanceof File ? input.name : undefined)

  // Trong môi trường không có DOM (ví dụ node test runner không có canvas)
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      blob: input,
      mimeType: input.type || 'image/jpeg',
      width: 800,
      height: 600,
      size: input.size,
      fileName: originalName,
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(input)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const { targetWidth, targetHeight } = calculateTargetDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxDimension
        )

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas 2D context is not available')
        }

        // Vẽ ảnh lên canvas với kích thước mới
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Ưu tiên nén WebP, fallback sang JPEG
        const tryExport = (type: string) => {
          return new Promise<Blob | null>((res) => {
            canvas.toBlob((b) => res(b), type, quality)
          })
        }

        tryExport('image/webp').then(async (webpBlob) => {
          if (webpBlob) {
            resolve({
              blob: webpBlob,
              mimeType: 'image/webp',
              width: targetWidth,
              height: targetHeight,
              size: webpBlob.size,
              fileName: originalName ? originalName.replace(/\.[^/.]+$/, '.webp') : undefined,
            })
            return
          }

          // Fallback sang jpeg
          const jpegBlob = await tryExport('image/jpeg')
          if (jpegBlob) {
            resolve({
              blob: jpegBlob,
              mimeType: 'image/jpeg',
              width: targetWidth,
              height: targetHeight,
              size: jpegBlob.size,
              fileName: originalName ? originalName.replace(/\.[^/.]+$/, '.jpg') : undefined,
            })
            return
          }

          // Nếu cả hai đều không thể tạo blob, trả về input gốc
          resolve({
            blob: input,
            mimeType: input.type || 'image/png',
            width: targetWidth,
            height: targetHeight,
            size: input.size,
            fileName: originalName,
          })
        }).catch(err => reject(err))
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image for optimization: ${String(err)}`))
    }

    img.src = objectUrl
  })
}
