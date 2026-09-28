import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { AlertCircle, CheckCircle2, BookOpen, Network, Globe2 } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { useNavigate } from 'react-router-dom'
import type { TopicGapAnalysis } from '@/types'

interface Props {
  breakdown: TopicGapAnalysis[]
  score: number
  totalQuestions: number
  correctCount: number
}

export const KnowledgeGapReport: React.FC<Props> = ({
  breakdown,
  score,
  totalQuestions,
  correctCount,
}) => {
  const navigate = useNavigate()

  const weakTopics = breakdown.filter(t => t.percent < 60)
  const strongTopics = breakdown.filter(t => t.percent >= 80)

  const chartData = breakdown.map(b => ({
    name: b.topicName.length > 15 ? b.topicName.slice(0, 14) + '...' : b.topicName,
    fullName: b.topicName,
    percent: Math.round(b.percent),
    correct: b.correct,
    total: b.total,
  }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {vi.quiz.score}
          </div>
          <div className={`text-3xl font-extrabold mt-1 ${score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
            {score.toFixed(1)} / 10
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {vi.quiz.correctRate}
          </div>
          <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
            {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ({correctCount}/{totalQuestions} câu)
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Lỗ hổng cần ôn
          </div>
          <div className={`text-3xl font-extrabold mt-1 ${weakTopics.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {weakTopics.length} chủ đề
          </div>
        </div>
      </div>

      {/* Chart: Topic Performance */}
      {chartData.length > 0 && (
        <div className="card p-4">
          <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">
            Biểu đồ mức độ nắm vững từng chủ đề (%)
          </h4>
          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [`${val ?? 0}%`, 'Độ chính xác']}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.fullName || ''}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percent >= 80 ? '#10b981' : entry.percent >= 60 ? '#3b82f6' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weak Topics Analysis & Cross-module Actions */}
      {weakTopics.length > 0 && (
        <div className="card p-5 border-l-4 border-rose-500 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3>{vi.quiz.weakTopics}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Các chủ đề dưới 60% có nguy cơ mất điểm cao trong kỳ thi. Hệ thống khuyến nghị ôn tập theo kế hoạch liên kết chéo sau:
          </p>

          <div className="space-y-3">
            {weakTopics.map(w => (
              <div
                key={w.topicId}
                className="p-3 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {w.topicName}
                  </div>
                  <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                    Chỉ đúng {w.correct}/{w.total} câu ({Math.round(w.percent)}%)
                  </div>
                </div>

                {/* Cross-module quick link buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => navigate('/notes')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium transition-colors"
                    title={vi.quiz.openNote}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ghi chú</span>
                  </button>

                  <button
                    onClick={() => navigate('/mindmap')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-[11px] font-medium transition-colors"
                    title={vi.quiz.openMindmap}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Sơ đồ tư duy</span>
                  </button>

                  <button
                    onClick={() => navigate('/knowledge')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-medium transition-colors"
                    title={vi.quiz.openKnowledge}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Bách khoa tri thức</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Topics */}
      {strongTopics.length > 0 && (
        <div className="card p-4 border-l-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 text-xs">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <h4>{vi.quiz.strongTopics}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {strongTopics.map(s => (
              <span
                key={s.topicId}
                className="px-2.5 py-1 bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-lg font-medium text-xs"
              >
                ✓ {s.topicName} ({Math.round(s.percent)}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
