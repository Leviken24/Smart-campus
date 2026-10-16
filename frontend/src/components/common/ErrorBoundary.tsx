import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="glass-panel p-6 max-w-md w-full border-rose-800/80 text-center">
            <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-100">Something went wrong</h2>
            <p className="text-xs text-slate-400 mt-1">
              An unexpected rendering error occurred in this view.
            </p>
            {this.state.error && (
              <pre className="mt-4 p-3 bg-slate-950/80 rounded-lg text-left text-[11px] text-rose-300 overflow-x-auto border border-rose-900/50">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
