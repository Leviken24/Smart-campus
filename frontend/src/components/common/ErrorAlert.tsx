import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ApiError } from '@/services/api/client';

interface ErrorAlertProps {
  error: Error | ApiError | string | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isApiError = error instanceof ApiError;

  return (
    <div
      className={`p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-rose-300">
            {isApiError ? `Error (${error.status}): ${error.errorType}` : 'Connection / Request Issue'}
          </h4>
          <p className="text-xs text-rose-200/90 mt-0.5">{errorMessage}</p>
          {isApiError && error.timestamp && (
            <p className="text-[10px] text-rose-400/70 mt-1 font-mono">
              Timestamp: {new Date(error.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 border border-rose-700/60 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
