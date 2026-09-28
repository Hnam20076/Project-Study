import React, { useState } from 'react'
import type {
  ElectronicComponent,
  ComponentCategory,
  PackageType,
  ComponentPin,
  PinType,
} from '@/types'
import {
  COMPONENT_CATEGORY_LABELS,
  PIN_TYPE_LABELS,
} from '@/types'
import { X, Plus, Trash2 } from 'lucide-react'
import { vi } from '@/i18n/vi'

interface Props {
  isOpen: boolean
  initialData?: ElectronicComponent | null
  onClose: () => void
  onSave: (data: Omit<ElectronicComponent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export const ComponentModal: React.FC<Props> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [code, setCode] = useState(initialData?.code ?? '')
  const [category, setCategory] = useState<ComponentCategory>(initialData?.category ?? 'ic')
  const [pkg, setPkg] = useState<PackageType>(initialData?.package ?? 'DIP-8')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [voltMin, setVoltMin] = useState(initialData?.operatingVoltage?.min ?? 3.3)
  const [voltTyp, setVoltTyp] = useState<number | undefined>(initialData?.operatingVoltage?.typ ?? 5.0)
  const [voltMax, setVoltMax] = useState(initialData?.operatingVoltage?.max ?? 5.5)
  const [voltUnit, setVoltUnit] = useState(initialData?.operatingVoltage?.unit ?? 'V')
  const [maxCurrent, setMaxCurrent] = useState(initialData?.maxCurrent ?? '')
  const [frequency, setFrequency] = useState(initialData?.frequency ?? '')
  const [tempRange, setTempRange] = useState(initialData?.temperatureRange ?? '')
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer ?? '')
  const [datasheetUrl, setDatasheetUrl] = useState(initialData?.datasheetUrl ?? '')
  const [verified, setVerified] = useState(initialData?.verified ?? false)

  // Pins state
  const [pins, setPins] = useState<ComponentPin[]>(
    initialData?.pins ?? [
      { number: 1, name: 'GND', type: 'ground', description: 'Mass nối đất (0V)' },
      { number: 2, name: 'VCC', type: 'power', description: 'Nguồn cấp dương' },
    ]
  )

  if (!isOpen) return null

  const handleAddPin = () => {
    const nextNum = pins.length > 0 ? Math.max(...pins.map(p => p.number)) + 1 : 1
    setPins([
      ...pins,
      { number: nextNum, name: `P${nextNum}`, type: 'io', description: 'Chân tín hiệu' },
    ])
  }

  const handleRemovePin = (idx: number) => {
    setPins(pins.filter((_, i) => i !== idx))
  }

  const handleUpdatePin = (idx: number, field: keyof ComponentPin, val: unknown) => {
    setPins(
      pins.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    await onSave({
      name: name.trim(),
      code: code.trim(),
      category,
      package: pkg,
      description: description.trim(),
      operatingVoltage: {
        min: Number(voltMin),
        typ: voltTyp !== undefined && voltTyp !== null ? Number(voltTyp) : undefined,
        max: Number(voltMax),
        unit: voltUnit,
      },
      maxCurrent: maxCurrent.trim() || undefined,
      frequency: frequency.trim() || undefined,
      temperatureRange: tempRange.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      datasheetUrl: datasheetUrl.trim() || undefined,
      verified,
      pins,
      tags: [name.toLowerCase(), code.toLowerCase(), category, pkg.toLowerCase()],
    })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-dark-border">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {initialData ? vi.components.editComponent : vi.components.addComponent}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tên linh kiện *
              </label>
              <input
                type="text"
                required
                placeholder="VD: NE555, LM358, 2N2222"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Mã định danh (Part Number) *
              </label>
              <input
                type="text"
                required
                placeholder="VD: NE555P, LM358N"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phân loại linh kiện
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ComponentCategory)}
                className="input"
              >
                {Object.entries(COMPONENT_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Kiểu đóng gói (Package)
              </label>
              <select
                value={pkg}
                onChange={e => setPkg(e.target.value as PackageType)}
                className="input font-mono"
              >
                <option value="DIP-8">DIP-8</option>
                <option value="DIP-14">DIP-14</option>
                <option value="DIP-16">DIP-16</option>
                <option value="DIP-28">DIP-28</option>
                <option value="TO-92">TO-92</option>
                <option value="TO-220">TO-220</option>
                <option value="Module">Bo mạch / Module</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mô tả kỹ thuật
            </label>
            <textarea
              rows={2}
              placeholder="Chức năng chính, ứng dụng thực tế..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input resize-none"
            />
          </div>

          {/* Điện áp hoạt động */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Điện áp hoạt động (Min / Typ / Max / Đơn vị)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Min"
                value={voltMin}
                onChange={e => setVoltMin(Number(e.target.value))}
                className="input font-mono"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Typ"
                value={voltTyp ?? ''}
                onChange={e => setVoltTyp(e.target.value ? Number(e.target.value) : undefined)}
                className="input font-mono"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Max"
                value={voltMax}
                onChange={e => setVoltMax(Number(e.target.value))}
                className="input font-mono"
              />
              <input
                type="text"
                placeholder="V"
                value={voltUnit}
                onChange={e => setVoltUnit(e.target.value)}
                className="input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dòng điện tối đa
              </label>
              <input
                type="text"
                placeholder="VD: 200 mA, 800 mA"
                value={maxCurrent}
                onChange={e => setMaxCurrent(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tần số làm việc
              </label>
              <input
                type="text"
                placeholder="VD: 500 kHz, 16 MHz"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dải nhiệt độ
              </label>
              <input
                type="text"
                placeholder="VD: -40°C đến 85°C"
                value={tempRange}
                onChange={e => setTempRange(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nhà sản xuất
              </label>
              <input
                type="text"
                placeholder="VD: Texas Instruments, ST, Microchip"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Liên kết Datasheet (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={datasheetUrl}
                onChange={e => setDatasheetUrl(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Verified Checkbox */}
          <div className="p-3 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Xác minh thông số kỹ thuật (Datasheet)
              </div>
              <div className="text-[11px] text-slate-500">
                Chỉ bật nếu bạn đã đối chiếu trực tiếp từ tài liệu kỹ thuật chính thức.
              </div>
            </div>
            <input
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
          </div>

          {/* Pin List Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Cấu hình danh sách chân ({pins.length})
              </label>
              <button
                type="button"
                onClick={handleAddPin}
                className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm chân</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pins.map((pin, pIdx) => (
                <div
                  key={pIdx}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
                >
                  <input
                    type="number"
                    value={pin.number}
                    onChange={e => handleUpdatePin(pIdx, 'number', Number(e.target.value))}
                    className="w-14 input py-1 px-1.5 font-mono text-center"
                    placeholder="Số"
                  />
                  <input
                    type="text"
                    value={pin.name}
                    onChange={e => handleUpdatePin(pIdx, 'name', e.target.value)}
                    className="w-24 input py-1 px-2 font-mono font-bold"
                    placeholder="Tên chân"
                  />
                  <select
                    value={pin.type}
                    onChange={e => handleUpdatePin(pIdx, 'type', e.target.value as PinType)}
                    className="w-32 input py-1 px-1.5"
                  >
                    {Object.entries(PIN_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={pin.description}
                    onChange={e => handleUpdatePin(pIdx, 'description', e.target.value)}
                    className="flex-1 input py-1 px-2"
                    placeholder="Chức năng kỹ thuật"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePin(pIdx)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-border">
            <button type="button" onClick={onClose} className="btn-secondary">
              {vi.common.cancel}
            </button>
            <button type="submit" className="btn-primary">
              {vi.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
