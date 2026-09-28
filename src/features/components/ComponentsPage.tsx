import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { componentRepo } from '@/db/repositories'
import type { ElectronicComponent, ComponentCategory, PackageType } from '@/types'
import { COMPONENT_CATEGORY_LABELS } from '@/types'
import { ComponentDetailPanel } from './ComponentDetailPanel'
import { ComponentModal } from './ComponentModal'
import {
  Cpu,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
} from 'lucide-react'
import { vi } from '@/i18n/vi'
import { toast } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ComponentsPageContent: React.FC = () => {
  const allComponents = useLiveQuery(() => componentRepo.getAll(), []) ?? []

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all')
  const [selectedPackage, setSelectedPackage] = useState<PackageType | 'all'>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Selected component
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<ElectronicComponent | null>(null)

  // Filtered list
  const filteredComponents = allComponents.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false
    if (selectedPackage !== 'all' && c.package !== selectedPackage) return false
    if (verifiedOnly && !c.verified) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = c.name.toLowerCase().includes(q)
      const matchCode = c.code.toLowerCase().includes(q)
      const matchDesc = c.description.toLowerCase().includes(q)
      const matchPkg = c.package.toLowerCase().includes(q)
      const matchPins = c.pins.some(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      )
      if (!matchName && !matchCode && !matchDesc && !matchPkg && !matchPins) {
        return false
      }
    }
    return true
  })

  // Selected component object
  const activeComponent =
    allComponents.find(c => c.id === selectedId) ||
    filteredComponents[0] ||
    null

  const handleOpenAdd = () => {
    setEditingComponent(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (comp: ElectronicComponent) => {
    setEditingComponent(comp)
    setIsModalOpen(true)
  }

  const handleSaveComponent = async (
    data: Omit<ElectronicComponent, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (editingComponent) {
        await componentRepo.update(editingComponent.id, data)
        toast.success(vi.toast.updated)
      } else {
        const created = await componentRepo.create(data)
        setSelectedId(created.id)
        toast.success(vi.toast.created)
      }
    } catch (err) {
      console.error(err)
      toast.error(vi.errors.saveFailed)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa linh kiện này?')) {
      try {
        await componentRepo.delete(id)
        toast.success(vi.toast.deleted)
        if (selectedId === id) setSelectedId(null)
      } catch (err) {
        console.error(err)
        toast.error(vi.errors.deleteFailed)
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {vi.components.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {vi.components.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{vi.components.addComponent}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-dark-border">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={vi.components.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-9 py-1.5 text-xs w-full"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Package selector */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPackage}
                onChange={e => setSelectedPackage(e.target.value as PackageType | 'all')}
                className="input py-1 px-2 text-xs font-mono"
              >
                <option value="all">Tất cả kiểu chân</option>
                <option value="DIP-8">DIP-8</option>
                <option value="DIP-14">DIP-14</option>
                <option value="DIP-16">DIP-16</option>
                <option value="DIP-28">DIP-28</option>
                <option value="TO-92">TO-92</option>
                <option value="TO-220">TO-220</option>
                <option value="Module">Bo mạch / Module</option>
              </select>
            </div>

            {/* Verified only checkbox */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Đã xác minh
              </span>
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất cả ({allComponents.length})
          </button>
          {Object.entries(COMPONENT_CATEGORY_LABELS).map(([k, label]) => {
            const count = allComponents.filter(c => c.category === k).length
            return (
              <button
                key={k}
                onClick={() => setSelectedCategory(k as ComponentCategory)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === k
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area: Split View */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Component List */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full overflow-hidden card bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border">
          <div className="p-3 border-b border-slate-100 dark:border-dark-border flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Danh sách ({filteredComponents.length})</span>
            <span>{selectedCategory !== 'all' ? COMPONENT_CATEGORY_LABELS[selectedCategory] : 'Tất cả'}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border p-2 space-y-1">
            {filteredComponents.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-400">
                <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p>{vi.components.noComponentsFound}</p>
              </div>
            ) : (
              filteredComponents.map(comp => {
                const isSelected = activeComponent?.id === comp.id
                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedId(comp.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/40 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-card border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {comp.name}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {comp.verified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Đã xác minh datasheet" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Chưa xác minh" />
                        )}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-muted text-slate-600 dark:text-slate-300">
                          {comp.package}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {comp.code}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {comp.description}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-dark-border/50 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <Zap className="w-3 h-3" />
                        {comp.operatingVoltage.min}-{comp.operatingVoltage.max}{comp.operatingVoltage.unit}
                      </span>
                      <span>{comp.pins.length} chân</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-8 xl:col-span-9 h-full overflow-hidden">
          {activeComponent ? (
            <ComponentDetailPanel
              component={activeComponent}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="card h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Cpu className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                Chọn một linh kiện để xem chi tiết
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Sơ đồ chân pinout trực quan, thông số vận hành và các mạch ứng dụng mẫu chuẩn xác.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <ComponentModal
        isOpen={isModalOpen}
        initialData={editingComponent}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveComponent}
      />
    </div>
  )
}

export function ComponentsPage() {
  return (
    <ErrorBoundary>
      <ComponentsPageContent />
    </ErrorBoundary>
  )
}
