import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { vi } from '@/i18n/vi'
import { pageRepo, scheduleRepo, mindmapRepo, knowledgeNodeRepo, questionRepo, formulaRepo } from '@/db/repositories'
import { debounce, truncate } from '@/lib/utils'
import type { SearchResult } from '@/types'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Tìm kiếm debounce 200ms
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const lowerQ = q.toLowerCase()
        const [pages, schedules, mindmaps, knodes, qList, fList] = await Promise.all([
          pageRepo.searchFullText(q),
          scheduleRepo.getAll(),
          mindmapRepo.getAll(),
          knowledgeNodeRepo.getAll(),
          questionRepo.getAll(),
          formulaRepo.getAll(),
        ])

        const pageResults: SearchResult[] = pages.map(p => ({
          id: p.id,
          type: 'note' as const,
          title: p.title || vi.common.untitled,
          subtitle: vi.nav.notes,
          url: `/notes`,
          excerpt: truncate(p.content.replace(/<[^>]+>/g, ' '), 80),
          updatedAt: p.updatedAt,
        }))

        const scheduleResults: SearchResult[] = schedules
          .filter(s =>
            s.className.toLowerCase().includes(lowerQ) ||
            (s.teacher?.toLowerCase().includes(lowerQ) ?? false)
          )
          .slice(0, 3)
          .map(s => ({
            id: s.id,
            type: 'schedule' as const,
            title: s.className,
            subtitle: vi.nav.schedule,
            url: '/schedule',
            updatedAt: s.updatedAt,
          }))

        const mindmapResults: SearchResult[] = mindmaps
          .filter(m =>
            m.name.toLowerCase().includes(lowerQ) ||
            m.nodes.some(n => n.label.toLowerCase().includes(lowerQ))
          )
          .slice(0, 3)
          .map(m => ({
            id: m.id,
            type: 'mindmap' as const,
            title: m.name,
            subtitle: vi.mindmap.title,
            url: '/mindmap',
            excerpt: `${m.nodes.length} nodes · ${m.edges.length} liên kết`,
            updatedAt: m.updatedAt,
          }))

        const knowledgeResults: SearchResult[] = knodes
          .filter(kn =>
            kn.title.toLowerCase().includes(lowerQ) ||
            kn.description.toLowerCase().includes(lowerQ) ||
            kn.tags.some(t => t.toLowerCase().includes(lowerQ))
          )
          .slice(0, 3)
          .map(kn => ({
            id: kn.id,
            type: 'knowledge_node' as const,
            title: kn.title,
            subtitle: vi.knowledge.title,
            url: '/knowledge',
            excerpt: truncate(kn.description, 80),
            updatedAt: kn.updatedAt,
          }))

        const questionResults: SearchResult[] = qList
          .filter(qu =>
            qu.prompt.toLowerCase().includes(lowerQ) ||
            qu.tags.some(t => t.toLowerCase().includes(lowerQ))
          )
          .slice(0, 3)
          .map(qu => ({
            id: qu.id,
            type: 'question' as const,
            title: truncate(qu.prompt.replace(/\$/g, ''), 50),
            subtitle: vi.quiz.title,
            url: '/quiz',
            excerpt: truncate(qu.explanation, 80),
            updatedAt: qu.updatedAt,
          }))

        const formulaResults: SearchResult[] = fList
          .filter(fo =>
            fo.name.toLowerCase().includes(lowerQ) ||
            fo.description.toLowerCase().includes(lowerQ) ||
            fo.tags.some(t => t.toLowerCase().includes(lowerQ))
          )
          .slice(0, 3)
          .map(fo => ({
            id: fo.id,
            type: 'formula' as const,
            title: fo.name,
            subtitle: vi.calculator.title,
            url: '/calculator',
            excerpt: fo.latex,
            updatedAt: fo.updatedAt,
          }))

        setResults([
          ...pageResults,
          ...mindmapResults,
          ...knowledgeResults,
          ...questionResults,
          ...formulaResults,
          ...scheduleResults,
        ])
        setSelectedIndex(0)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 200) as (q: string) => void,
    []
  )

  useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  // Phím tắt
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!commandPaletteOpen) return

      if (e.key === 'Escape') {
        closeCommandPalette()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, results, selectedIndex]) // eslint-disable-line

  function handleSelect(result: SearchResult) {
    navigate(result.url)
    closeCommandPalette()
    setQuery('')
    setResults([])
  }

  function handleClose() {
    closeCommandPalette()
    setQuery('')
    setResults([])
  }

  if (!commandPaletteOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-border animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-dark-border">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={vi.commandPalette.placeholder}
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-xs text-slate-400 border border-slate-300 dark:border-dark-border px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              {vi.common.loading}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              {vi.commandPalette.noResults}
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="p-2">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                      index === selectedIndex
                        ? 'bg-primary-50 dark:bg-primary-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-muted'
                    )}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {result.title}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {result.subtitle}
                      </span>
                    </div>
                    {result.excerpt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {result.excerpt}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Quick actions khi không có query */}
          {!query && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                {vi.commandPalette.actions}
              </p>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/notes'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  📝 {vi.dashboard.newNote}
                </span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/schedule'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  📅 {vi.dashboard.newSchedule}
                </span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/mindmap'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  🧠 {vi.mindmap.title}
                </span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/quiz'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  🎯 {vi.quiz.title}
                </span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/calculator'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  🧮 {vi.calculator.title}
                </span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-muted transition-colors"
                onClick={() => { navigate('/knowledge'); handleClose() }}
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  🌐 {vi.knowledge.title}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
