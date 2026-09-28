import React, { useState } from 'react'
import type { ElectronicComponent } from '@/types'
import {
  PIN_TYPE_COLORS,
  PIN_TYPE_LABELS,
  COMPONENT_CATEGORY_LABELS,
} from '@/types'
import { PinoutVisualizer } from './PinoutVisualizer'
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  Cpu,
  Zap,
  Activity,
  Thermometer,
  FileSpreadsheet,
  Search,
} from 'lucide-react'
import { vi } from '@/i18n/vi'

interface Props {
  component: ElectronicComponent
  onEdit: (comp: ElectronicComponent) => void
  onDelete: (id: string) => void
}

export const ComponentDetailPanel: React.FC<Props> = ({
  component,
  onEdit,
  onDelete,
}) => {
  const [selectedPinNumber, setSelectedPinNumber] = useState<number | null>(null)
  const [pinSearch, setPinSearch] = useState('')

  // Filter pins
  const filteredPins = component.pins.filter(p => {
    if (!pinSearch.trim()) return true
    const q = pinSearch.toLowerCase()
    return (
      p.number.toString().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      PIN_TYPE_LABELS[p.type].toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border overflow-y-auto">
      {/* Top Banner Warning (Quy tắc vàng M7) */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <span>{vi.components.datasheetWarning}</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-dark-border">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {component.name}
              </h1>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300">
                {component.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/40">
                {component.package}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-400">
                {COMPONENT_CATEGORY_LABELS[component.category]}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {component.description}
            </p>

            {component.manufacturer && (
              <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Nhà sản xuất: <span className="text-slate-600 dark:text-slate-300 font-medium">{component.manufacturer}</span>
              </div>
            )}
          </div>

          {/* Action buttons & Verified badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {component.verified ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{vi.components.verifiedBadge}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{vi.components.unverifiedBadge}</span>
              </div>
            )}

            <button
              onClick={() => onEdit(component)}
              className="btn-secondary p-2 text-xs"
              title={vi.components.editComponent}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(component.id)}
              className="btn-ghost p-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              title={vi.common.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Datasheet Link if available */}
        {component.datasheetUrl && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Cpu className="w-4 h-4 text-primary-500" />
              <span>Tài liệu kỹ thuật chính thức từ nhà sản xuất</span>
            </div>
            <a
              href={component.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <span>{vi.components.viewDatasheet}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Key Electrical Specs Grid */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Thông số kỹ thuật vận hành
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-3 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{vi.components.operatingVoltage}</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {component.operatingVoltage.min} - {component.operatingVoltage.max} {component.operatingVoltage.unit}
              </div>
              {component.operatingVoltage.typ !== undefined && (
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Chuẩn: {component.operatingVoltage.typ} {component.operatingVoltage.unit}
                </div>
              )}
            </div>

            <div className="card p-3 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>{vi.components.maxCurrent}</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {component.maxCurrent || 'Theo datasheet'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Dòng định mức</div>
            </div>

            <div className="card p-3 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                <span>{vi.components.frequency}</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {component.frequency || 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tần số làm việc</div>
            </div>

            <div className="card p-3 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                <span>{vi.components.tempRange}</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {component.temperatureRange || 'Tiêu chuẩn'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Nhiệt độ hoạt động</div>
            </div>
          </div>
        </div>

        {/* Pinout Visualizer Section */}
        <div className="card p-5 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-500" />
              <span>{vi.components.pinoutTitle}</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Tổng số chân: {component.pins.length}
            </span>
          </div>

          <PinoutVisualizer
            packageName={component.package}
            pins={component.pins}
            selectedPinNumber={selectedPinNumber}
            onSelectPin={setSelectedPinNumber}
          />
        </div>

        {/* Detailed Pin Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {vi.components.pinTable} ({filteredPins.length}/{component.pins.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Lọc chân (VD: VCC, GND, ngõ ra)..."
                value={pinSearch}
                onChange={e => setPinSearch(e.target.value)}
                className="input pl-8 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-dark-surface text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="py-2.5 px-3 w-16 font-semibold">{vi.components.pinNumber}</th>
                  <th className="py-2.5 px-3 w-28 font-semibold">{vi.components.pinName}</th>
                  <th className="py-2.5 px-3 w-36 font-semibold">{vi.components.pinType}</th>
                  <th className="py-2.5 px-3 font-semibold">{vi.components.pinFunction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {filteredPins.map(pin => {
                  const isSelected = selectedPinNumber === pin.number
                  return (
                    <tr
                      key={pin.number}
                      onClick={() => setSelectedPinNumber(pin.number)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/40 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-dark-muted/50'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">
                        #{pin.number}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {pin.name}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: PIN_TYPE_COLORS[pin.type] + '22',
                            color: PIN_TYPE_COLORS[pin.type],
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: PIN_TYPE_COLORS[pin.type] }}
                          />
                          {PIN_TYPE_LABELS[pin.type]}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pin.description}
                        {(pin.voltageMax || pin.currentMax) && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            {pin.voltageMax && `[Vmax: ${pin.voltageMax}] `}
                            {pin.currentMax && `[Imax: ${pin.currentMax}]`}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Circuits Section */}
        {component.applicationCircuits && component.applicationCircuits.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{vi.components.circuitsTitle}</span>
            </h2>

            <div className="space-y-4">
              {component.applicationCircuits.map((circuit, idx) => (
                <div
                  key={idx}
                  className="card p-5 bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border space-y-3"
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {circuit.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {circuit.description}
                  </p>

                  <div className="p-3 bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-dark-border text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      {vi.components.schematicExplanation}:
                    </span>
                    {circuit.schematicExplanation}
                  </div>

                  {circuit.bom && circuit.bom.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {vi.components.bomTitle}:
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-dark-border">
                        <table className="w-full text-left text-xs bg-white dark:bg-dark-card">
                          <thead className="bg-slate-100 dark:bg-dark-surface text-slate-500 text-[11px]">
                            <tr>
                              <th className="py-1.5 px-3">Linh kiện</th>
                              <th className="py-1.5 px-3 w-16 text-center">{vi.components.qty}</th>
                              <th className="py-1.5 px-3">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                            {circuit.bom.map((b, bIdx) => (
                              <tr key={bIdx}>
                                <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                  {b.componentName}
                                </td>
                                <td className="py-1.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                  {b.quantity}
                                </td>
                                <td className="py-1.5 px-3 text-slate-500">
                                  {b.note || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
