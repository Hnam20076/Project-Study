import { create } from 'zustand'
import type { ThemeMode } from '@/types'

// === Theme Store ===
interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  resolvedTheme: 'light' | 'dark'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme()
  return mode
}

function applyTheme(resolved: 'light' | 'dark'): void {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Đọc theme từ localStorage
const savedMode = (localStorage.getItem('theme_mode') as ThemeMode | null) ?? 'system'
const initialResolved = resolveTheme(savedMode)
applyTheme(initialResolved)

export const useThemeStore = create<ThemeState>((set) => ({
  mode: savedMode,
  resolvedTheme: initialResolved,
  setMode: (mode) => {
    const resolved = resolveTheme(mode)
    applyTheme(resolved)
    localStorage.setItem('theme_mode', mode)
    set({ mode, resolvedTheme: resolved })
  },
}))

// Lắng nghe thay đổi system theme
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  const state = useThemeStore.getState()
  if (state.mode === 'system') {
    const resolved = getSystemTheme()
    applyTheme(resolved)
    useThemeStore.setState({ resolvedTheme: resolved })
  }
})

// === UI Store (sidebar, modal, ...) ===
interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}))
