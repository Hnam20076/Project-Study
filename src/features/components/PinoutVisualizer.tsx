import React, { useState } from 'react'
import type { ComponentPin, PackageType } from '@/types'
import { PIN_TYPE_COLORS, PIN_TYPE_LABELS } from '@/types'

interface Props {
  packageName: PackageType
  pins: ComponentPin[]
  selectedPinNumber?: number | null
  onSelectPin?: (pinNumber: number) => void
}

export const PinoutVisualizer: React.FC<Props> = ({
  packageName,
  pins,
  selectedPinNumber,
  onSelectPin,
}) => {
  const [hoveredPin, setHoveredPin] = useState<ComponentPin | null>(null)

  // Map pins by number
  const pinMap = new Map<number, ComponentPin>()
  pins.forEach(p => pinMap.set(p.number, p))

  // Render for DIP packages (DIP-8, DIP-14, DIP-16, DIP-28)
  if (packageName.startsWith('DIP-')) {
    const totalPins = parseInt(packageName.replace('DIP-', ''), 10) || 8
    const half = Math.floor(totalPins / 2)

    // Calculate dynamic dimensions
    const pinPitch = 36
    const bodyWidth = 120
    const pinLength = 36
    const totalHeight = (half + 1) * pinPitch + 20
    const totalWidth = bodyWidth + pinLength * 2 + 160 // Extra padding for text labels

    const leftPins: number[] = []
    for (let i = 1; i <= half; i++) leftPins.push(i)

    const rightPins: number[] = []
    for (let i = totalPins; i > half; i--) rightPins.push(i)

    const bodyX = pinLength + 80
    const bodyY = 20
    const bodyH = (half + 0.5) * pinPitch

    return (
      <div className="flex flex-col items-center select-none">
        <div className="relative overflow-x-auto w-full flex justify-center py-2">
          <svg
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="w-full max-w-lg h-auto transition-all"
            style={{ minHeight: '260px' }}
          >
            <defs>
              <filter id="chip-shadow" x="-5%" y="-5%" width="110%" height="115%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* IC Body */}
            <rect
              x={bodyX}
              y={bodyY}
              width={bodyWidth}
              height={bodyH}
              rx={10}
              className="fill-slate-800 dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-600"
              strokeWidth="2"
              filter="url(#chip-shadow)"
            />

            {/* IC Orientation Notch (Semi-circle at the top) */}
            <path
              d={`M ${bodyX + bodyWidth / 2 - 14} ${bodyY} A 14 14 0 0 0 ${bodyX + bodyWidth / 2 + 14} ${bodyY}`}
              className="fill-slate-900 dark:fill-slate-950 stroke-slate-700 dark:stroke-slate-600"
              strokeWidth="1.5"
            />

            {/* Dot near Pin 1 */}
            <circle
              cx={bodyX + 16}
              cy={bodyY + 22}
              r={4}
              className="fill-slate-600 dark:fill-slate-500"
            />

            {/* Left Pins (1 to half) */}
            {leftPins.map((pinNum, idx) => {
              const pin = pinMap.get(pinNum)
              const y = bodyY + (idx + 0.8) * pinPitch
              const isSelected = selectedPinNumber === pinNum
              const isHovered = hoveredPin?.number === pinNum
              const pinColor = pin ? PIN_TYPE_COLORS[pin.type] : '#94a3b8'

              return (
                <g
                  key={`pin-left-${pinNum}`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectPin?.(pinNum)}
                  onMouseEnter={() => pin && setHoveredPin(pin)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Metal Pin Lead */}
                  <rect
                    x={bodyX - pinLength}
                    y={y - 5}
                    width={pinLength}
                    height={10}
                    rx={2}
                    className={`transition-colors ${
                      isSelected || isHovered
                        ? 'fill-amber-400 stroke-amber-500'
                        : 'fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500'
                    }`}
                    strokeWidth="1.5"
                  />

                  {/* Colored Pin Tag Badge */}
                  <circle
                    cx={bodyX - pinLength + 4}
                    cy={y}
                    r={5}
                    fill={pinColor}
                  />

                  {/* Pin Number */}
                  <text
                    x={bodyX + 10}
                    y={y + 4}
                    className="text-[11px] font-mono font-bold fill-slate-300 dark:fill-slate-400"
                  >
                    {pinNum}
                  </text>

                  {/* Pin Name Label on Left */}
                  <text
                    x={bodyX - pinLength - 8}
                    y={y + 4}
                    textAnchor="end"
                    className={`text-[12px] font-mono font-bold transition-colors ${
                      isSelected || isHovered
                        ? 'fill-primary-600 dark:fill-primary-400 font-extrabold'
                        : 'fill-slate-800 dark:fill-slate-200'
                    }`}
                  >
                    {pin?.name ?? `P${pinNum}`}
                  </text>
                </g>
              )
            })}

            {/* Right Pins (totalPins down to half+1) */}
            {rightPins.map((pinNum, idx) => {
              const pin = pinMap.get(pinNum)
              const y = bodyY + (idx + 0.8) * pinPitch
              const isSelected = selectedPinNumber === pinNum
              const isHovered = hoveredPin?.number === pinNum
              const pinColor = pin ? PIN_TYPE_COLORS[pin.type] : '#94a3b8'

              return (
                <g
                  key={`pin-right-${pinNum}`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectPin?.(pinNum)}
                  onMouseEnter={() => pin && setHoveredPin(pin)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Metal Pin Lead */}
                  <rect
                    x={bodyX + bodyWidth}
                    y={y - 5}
                    width={pinLength}
                    height={10}
                    rx={2}
                    className={`transition-colors ${
                      isSelected || isHovered
                        ? 'fill-amber-400 stroke-amber-500'
                        : 'fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500'
                    }`}
                    strokeWidth="1.5"
                  />

                  {/* Colored Pin Tag Badge */}
                  <circle
                    cx={bodyX + bodyWidth + pinLength - 4}
                    cy={y}
                    r={5}
                    fill={pinColor}
                  />

                  {/* Pin Number */}
                  <text
                    x={bodyX + bodyWidth - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono font-bold fill-slate-300 dark:fill-slate-400"
                  >
                    {pinNum}
                  </text>

                  {/* Pin Name Label on Right */}
                  <text
                    x={bodyX + bodyWidth + pinLength + 8}
                    y={y + 4}
                    textAnchor="start"
                    className={`text-[12px] font-mono font-bold transition-colors ${
                      isSelected || isHovered
                        ? 'fill-primary-600 dark:fill-primary-400 font-extrabold'
                        : 'fill-slate-800 dark:fill-slate-200'
                    }`}
                  >
                    {pin?.name ?? `P${pinNum}`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Hover / Selected Pin Tooltip Detail */}
        {hoveredPin && (
          <div className="mt-2 p-3 bg-slate-900 text-white dark:bg-slate-800 rounded-xl shadow-lg text-xs max-w-md w-full animate-fade-in border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-sm text-primary-300">
                Chân #{hoveredPin.number}: {hoveredPin.name}
              </span>
              <span
                className="px-2 py-0.5 rounded-full font-medium text-[10px]"
                style={{
                  backgroundColor: PIN_TYPE_COLORS[hoveredPin.type] + '33',
                  color: PIN_TYPE_COLORS[hoveredPin.type],
                }}
              >
                {PIN_TYPE_LABELS[hoveredPin.type]}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">{hoveredPin.description}</p>
            {(hoveredPin.voltageMax || hoveredPin.currentMax) && (
              <div className="flex gap-4 mt-2 pt-2 border-t border-slate-700/60 font-mono text-[11px] text-slate-400">
                {hoveredPin.voltageMax && <span>Vmax: {hoveredPin.voltageMax}</span>}
                {hoveredPin.currentMax && <span>Imax: {hoveredPin.currentMax}</span>}
              </div>
            )}
          </div>
        )}

        {/* Pin Color Legend */}
        <div className="flex flex-wrap gap-2 justify-center mt-3 pt-3 border-t border-slate-200 dark:border-dark-border text-[11px]">
          {Object.entries(PIN_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: PIN_TYPE_COLORS[type as keyof typeof PIN_TYPE_COLORS] }}
              />
              <span className="text-slate-600 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render for TO-92 Transistor package (3 pins: 1, 2, 3)
  if (packageName === 'TO-92') {
    return (
      <div className="flex flex-col items-center select-none py-4">
        <svg viewBox="0 0 280 200" className="w-full max-w-xs h-auto">
          {/* TO-92 Semicircular Transistor Body (Flat face facing user) */}
          <path
            d="M 60 80 A 80 80 0 0 1 220 80 L 220 90 L 60 90 Z"
            className="fill-slate-800 dark:fill-slate-900 stroke-slate-700 dark:stroke-slate-600"
            strokeWidth="2"
          />
          <rect
            x={60}
            y={80}
            width={160}
            height={16}
            rx={2}
            className="fill-slate-700 dark:fill-slate-800"
          />
          <text
            x={140}
            y={65}
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-400 uppercase tracking-widest"
          >
            TO-92 (Nhìn từ mặt phẳng)
          </text>

          {/* 3 Leads: 1, 2, 3 */}
          {[1, 2, 3].map((pinNum, i) => {
            const pin = pinMap.get(pinNum)
            const x = 90 + i * 50
            const isSelected = selectedPinNumber === pinNum
            const isHovered = hoveredPin?.number === pinNum
            const pinColor = pin ? PIN_TYPE_COLORS[pin.type] : '#94a3b8'

            return (
              <g
                key={`to92-pin-${pinNum}`}
                className="cursor-pointer"
                onClick={() => onSelectPin?.(pinNum)}
                onMouseEnter={() => pin && setHoveredPin(pin)}
                onMouseLeave={() => setHoveredPin(null)}
              >
                {/* Lead wire */}
                <line
                  x1={x}
                  y1={96}
                  x2={x}
                  y2={160}
                  className={`transition-colors ${
                    isSelected || isHovered ? 'stroke-amber-400' : 'stroke-slate-400 dark:stroke-slate-500'
                  }`}
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Color badge */}
                <circle cx={x} cy={165} r={5} fill={pinColor} />

                {/* Pin Number */}
                <text
                  x={x}
                  y={182}
                  textAnchor="middle"
                  className="text-xs font-mono font-bold fill-slate-500 dark:fill-slate-400"
                >
                  #{pinNum}
                </text>

                {/* Pin Name */}
                <text
                  x={x}
                  y={196}
                  textAnchor="middle"
                  className={`text-xs font-bold font-mono ${
                    isSelected || isHovered ? 'fill-primary-600 dark:fill-primary-400' : 'fill-slate-800 dark:fill-slate-200'
                  }`}
                >
                  {pin?.name ?? `P${pinNum}`}
                </text>
              </g>
            )
          })}
        </svg>

        {hoveredPin && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl shadow text-xs max-w-sm w-full animate-fade-in border border-slate-700">
            <div className="font-mono font-bold text-sm text-primary-300">
              Chân #{hoveredPin.number}: {hoveredPin.name} ({PIN_TYPE_LABELS[hoveredPin.type]})
            </div>
            <p className="text-slate-300 mt-1">{hoveredPin.description}</p>
          </div>
        )}
      </div>
    )
  }

  // Fallback for Module / Other packages
  return (
    <div className="p-4 border border-dashed border-slate-300 dark:border-dark-border rounded-xl text-center">
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Đóng gói: {packageName} ({pins.length} chân)
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {pins.map(p => (
          <div
            key={p.number}
            onClick={() => onSelectPin?.(p.number)}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
              selectedPinNumber === p.number
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-muted'
            }`}
          >
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIN_TYPE_COLORS[p.type] }}
              />
              <span>#{p.number} {p.name}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {p.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
