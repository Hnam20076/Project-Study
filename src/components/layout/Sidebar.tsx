import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Network,
  Globe2,
  GraduationCap,
  Calculator,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useThemeStore } from '@/stores/uiStore'
import { vi } from '@/i18n/vi'
import { toast } from 'sonner'
import { exportAllData, importAllData, downloadJSON } from '@/db/exportImport'
import { deleteAllDemoData } from '@/db/repositories'
import { useRef } from 'react'

// Danh sách module đã hoàn thành (chỉ module enable = true mới hiện)
const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: vi.nav.dashboard, enabled: true },
  { path: '/schedule', icon: Calendar, label: vi.nav.schedule, enabled: true },
  { path: '/notes', icon: BookOpen, label: vi.nav.notes, enabled: true },
  { path: '/mindmap', icon: Network, label: vi.nav.mindmap, enabled: true },
  { path: '/quiz', icon: GraduationCap, label: vi.nav.quiz, enabled: true },
  { path: '/calculator', icon: Calculator, label: vi.nav.calculator, enabled: true },
  { path: '/knowledge', icon: Globe2, label: vi.nav.knowledge, enabled: true },
  { path: '/components', icon: Cpu, label: vi.nav.components, enabled: true },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { mode, setMode } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  // Xử lý xuất dữ liệu
  async function handleExport() {
    try {
      const data = await exportAllData()
      const filename = `study-os-backup-${new Date().toISOString().slice(0, 10)}.json`
      downloadJSON(data, filename)
      toast.success(vi.toast.exported)
    } catch (e) {
      toast.error(vi.errors.unknown)
      console.error(e)
    }
  }

  // Xử lý nhập dữ liệu
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(vi.dialog.importWarning)
    if (!confirmed) {
      e.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const raw = JSON.parse(text) as unknown
      await importAllData(raw)
      toast.success(vi.toast.imported)
      window.location.reload()
    } catch (err) {
      toast.error(vi.importExport.importError)
      console.error(err)
    } finally {
      e.target.value = ''
    }
  }

  // Xóa dữ liệu mẫu
  async function handleDeleteDemo() {
    const confirmed = window.confirm(vi.demo.deleteConfirm)
    if (!confirmed) return
    try {
      await deleteAllDemoData()
      localStorage.removeItem('study_os_seeded_v1')
      toast.success(vi.demo.deleteSuccess)
    } catch (e) {
      toast.error(vi.errors.deleteFailed)
      console.error(e)
    }
  }

  // Theme cycle
  function cycleTheme() {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }
    setMode(next[mode])
  }

  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
  const themeLabel = mode === 'light' ? vi.theme.light : mode === 'dark' ? vi.theme.dark : vi.theme.system

  return (
    <aside
      className={cn(
        'sidebar flex-shrink-0 select-none relative !overflow-visible',
        sidebarCollapsed && 'collapsed'
      )}
    >
      {/* Logo / App name */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-dark-border">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              Study OS
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Học tập cá nhân
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-1">
          {NAV_ITEMS.filter(item => item.enabled).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'nav-item-active'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-muted hover:text-slate-900 dark:hover:text-slate-100'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-200 dark:border-dark-border p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="btn-ghost w-full justify-start"
          title={themeLabel}
        >
          <ThemeIcon className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{themeLabel}</span>}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="btn-ghost w-full justify-start"
          title={vi.importExport.exportAll}
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{vi.importExport.exportAll}</span>}
        </button>

        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost w-full justify-start"
          title={vi.importExport.importAll}
        >
          <Upload className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{vi.importExport.importAll}</span>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        {/* Xóa dữ liệu mẫu */}
        <button
          onClick={handleDeleteDemo}
          className="btn-ghost w-full justify-start text-amber-600 dark:text-amber-400 hover:text-amber-700"
          title={vi.demo.deleteAll}
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{vi.demo.deleteAll}</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        title={sidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
      >
        {sidebarCollapsed
          ? <ChevronRight className="w-3 h-3 text-slate-500" />
          : <ChevronLeft className="w-3 h-3 text-slate-500" />
        }
      </button>
    </aside>
  )
}
