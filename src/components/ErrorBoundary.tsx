import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  moduleName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

// Error boundary bọc từng module để không crash toàn app
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.moduleName ?? 'Module'} Error]`, error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {this.props.moduleName
                ? `${this.props.moduleName} gặp lỗi`
                : 'Module gặp lỗi'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {this.state.error?.message ?? 'Lỗi không xác định'}
            </p>
            <button
              className="btn-secondary mt-4"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Thử lại
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
