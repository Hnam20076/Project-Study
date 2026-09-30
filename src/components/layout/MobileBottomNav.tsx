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
  CheckSquare,
  CalendarDays,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { path: '/planner', icon: CalendarDays, label: 'Kế hoạch' },
  { path: '/tasks', icon: CheckSquare, label: 'Nhiệm vụ' },
  { path: '/focus', icon: Timer, label: 'Tập trung' },
  { path: '/schedule', icon: Calendar, label: 'Lịch' },
  { path: '/notes', icon: BookOpen, label: 'Ghi chú' },
  { path: '/mindmap', icon: Network, label: 'Sơ đồ' },
  { path: '/quiz', icon: GraduationCap, label: 'Thi' },
  { path: '/calculator', icon: Calculator, label: 'Máy tính' },
  { path: '/knowledge', icon: Globe2, label: 'Tri thức' },
  { path: '/components', icon: Cpu, label: 'Linh kiện' },
]

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="bg-white dark:bg-dark-surface border-t border-slate-200 dark:border-dark-border safe-area-bottom">
      <div className="flex overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive && 'scale-110 transition-transform'
                )}
              />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
