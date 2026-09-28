import type { BaseEntity } from './index'

// === M7: Tra cứu linh kiện & chân IC điện tử ===

export type ComponentCategory = 'ic' | 'transistor' | 'diode' | 'sensor' | 'passive' | 'module'

export type PinType =
  | 'power'       // VCC, VDD (Đỏ)
  | 'ground'      // GND, VSS (Đen / Xám)
  | 'io'          // Digital GPIO (Xanh lá)
  | 'analog'      // ADC, Analog In/Out (Tím)
  | 'pwm'         // PWM output (Cam)
  | 'comm'        // UART, I2C, SPI (Xanh dương)
  | 'control'     // Reset, Enable, Clock (Vàng / Nâu)
  | 'passive'     // Chân cực Anode, Cathode, Base, Collector, Emitter

export interface ComponentPin {
  number: number
  name: string
  type: PinType
  description: string
  voltageMax?: string
  currentMax?: string
}

export type PackageType = 'DIP-8' | 'DIP-14' | 'DIP-16' | 'DIP-28' | 'TO-92' | 'TO-220' | 'Module' | 'Other'

export interface ApplicationCircuit {
  title: string
  description: string
  svgDiagram?: string
  schematicExplanation: string
  bom: { componentName: string; quantity: number; note?: string }[]
}

export interface ElectronicComponent extends BaseEntity {
  name: string                 // Ví dụ: NE555, LM358, 74HC595, 2N2222
  code: string                 // Mã định danh
  category: ComponentCategory
  package: PackageType
  description: string
  // Thông số kỹ thuật chính
  operatingVoltage: { min: number; typ?: number; max: number; unit: string }
  maxCurrent?: string
  frequency?: string
  temperatureRange?: string
  // Sơ đồ chân
  pins: ComponentPin[]
  // Mạch ứng dụng mẫu
  applicationCircuits?: ApplicationCircuit[]
  // Tài liệu & Xác minh
  datasheetUrl?: string
  verified: boolean            // Quy tắc vàng: nếu false hiển thị nhãn [chưa xác minh — đối chiếu datasheet]
  source?: string
  manufacturer?: string
}

export const PIN_TYPE_COLORS: Record<PinType, string> = {
  power: '#ef4444',    // Đỏ - VCC, VDD
  ground: '#334155',   // Đen xám - GND
  io: '#10b981',       // Xanh lá - GPIO
  analog: '#8b5cf6',   // Tím - ADC/Analog
  pwm: '#f97316',      // Cam - PWM
  comm: '#0284c7',     // Xanh dương - UART/I2C/SPI
  control: '#eab308',  // Vàng - Reset/Clock
  passive: '#64748b',  // Xám trung tính
}

export const PIN_TYPE_LABELS: Record<PinType, string> = {
  power: 'Nguồn (VCC/VDD)',
  ground: 'Mass (GND/VSS)',
  io: 'Xuất/Nhập (GPIO)',
  analog: 'Tương tự (ADC/DAC)',
  pwm: 'Điều xung (PWM)',
  comm: 'Giao tiếp (UART/I2C/SPI)',
  control: 'Điều khiển (Reset/Clock)',
  passive: 'Cực linh kiện',
}

export const COMPONENT_CATEGORY_LABELS: Record<ComponentCategory, string> = {
  ic: 'Vi mạch (IC)',
  transistor: 'Bán dẫn (Transistor/MOSFET)',
  diode: 'Diode / Chỉnh lưu',
  sensor: 'Cảm biến (Sensor)',
  passive: 'Thụ động (R, L, C)',
  module: 'Bo mạch / Module',
}
