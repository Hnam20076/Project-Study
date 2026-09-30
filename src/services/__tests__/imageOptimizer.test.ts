import { describe, it, expect } from 'vitest'
import { calculateTargetDimensions } from '../imageOptimizer'

describe('calculateTargetDimensions', () => {
  it('giữ nguyên kích thước nếu ảnh nhỏ hơn maxDimension', () => {
    const { targetWidth, targetHeight } = calculateTargetDimensions(800, 600, 1600)
    expect(targetWidth).toBe(800)
    expect(targetHeight).toBe(600)
  })

  it('thu nhỏ ảnh ngang có chiều rộng vượt quá maxDimension theo đúng tỷ lệ', () => {
    // 3200x1800 (16:9) => maxDimension 1600 => 1600x900
    const { targetWidth, targetHeight } = calculateTargetDimensions(3200, 1800, 1600)
    expect(targetWidth).toBe(1600)
    expect(targetHeight).toBe(900)
  })

  it('thu nhỏ ảnh dọc có chiều cao vượt quá maxDimension theo đúng tỷ lệ', () => {
    // 2000x4000 (1:2) => maxDimension 1600 => 800x1600
    const { targetWidth, targetHeight } = calculateTargetDimensions(2000, 4000, 1600)
    expect(targetWidth).toBe(800)
    expect(targetHeight).toBe(1600)
  })

  it('xử lý ảnh vuông vượt quá maxDimension', () => {
    const { targetWidth, targetHeight } = calculateTargetDimensions(2400, 2400, 1600)
    expect(targetWidth).toBe(1600)
    expect(targetHeight).toBe(1600)
  })

  it('xử lý trường hợp kích thước biên (0 hoặc số âm)', () => {
    const res = calculateTargetDimensions(0, 0, 1600)
    expect(res.targetWidth).toBeGreaterThanOrEqual(1)
    expect(res.targetHeight).toBeGreaterThanOrEqual(1)
  })
})
