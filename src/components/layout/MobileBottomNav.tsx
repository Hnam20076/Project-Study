import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { vi } from '@/i18n/vi'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: vi.nav.dashboard },
  { path: '/schedule', icon: Calendar, label: vi.nav.schedule },
  { path: '/notes', icon: BookOpen, label: vi.nav.notes },
]

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="bg-white dark:bg-dark-surface border-t border-slate-200 dark:border-dark-border safe-area-bottom">
      <div className="flex">
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
