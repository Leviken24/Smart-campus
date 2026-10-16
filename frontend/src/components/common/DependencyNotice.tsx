import React from 'react';
import { AlertCircle, RefreshCw, Code2 } from 'lucide-react';
import { ApiError } from '@/services/api/client';

interface DependencyNoticeProps {
  endpoint: string;
  method?: string;
  owner?: string;
  description?: string;
  error?: Error | ApiError | null;
  onRetry?: () => void;
  className?: string;
}

export const DependencyNotice: React.FC<DependencyNoticeProps> = ({
  endpoint,
  method = 'GET',
  owner = 'Person 2 (Digital Twin & Sensors)',
  description = 'Endpoint contract defined in docs/api-contracts.md. Awaiting backend route implementation.',
  error,
  onRetry,
  className = '',
}) => {
  const is404 = error instanceof ApiError && error.status === 404;
  const isNetwork = error instanceof ApiError && error.status === 0;

  return (
    <div
      className={`p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 text-amber-200 text-xs shadow-md space-y-2 ${className}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300">Backend Endpoint Pending:</span>
              <code className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 font-mono text-[11px] text-amber-200">
                {method} {endpoint}
              </code>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">{description}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 border border-amber-700/60 transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Check Endpoint
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-amber-800/40 flex flex-wrap items-center justify-between text-[10px] text-amber-400/80 font-mono">
        <span className="flex items-center gap-1">
          <Code2 className="w-3 h-3" /> Assigned Lead: {owner}
        </span>
        <span>
          {is404
            ? 'Status: HTTP 404 (Route not mounted)'
            : isNetwork
            ? 'Status: Backend unreachable on :8000'
            : error
            ? `Status: ${error.message}`
            : 'Status: Pending implementation'}
        </span>
      </div>
    </div>
  );
};
