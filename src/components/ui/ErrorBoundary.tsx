import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@arco-design/web-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-8',
            'rounded-xl border border-glass bg-glass border-glass',
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-400/15">
            <AlertTriangle className="h-7 w-7 text-amber-400" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-ink">组件加载失败</h3>
            <p className="mt-1 text-xs text-ink-3">
              {this.state.error?.message || '未知错误'}
            </p>
          </div>
          <Button
            type="primary"
            size="small"
            onClick={this.handleRetry}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}