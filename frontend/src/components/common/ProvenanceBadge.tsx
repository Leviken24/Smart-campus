import React from 'react';
import { ProvenanceType, PROVENANCE_CONFIGS } from '@/types/provenance';

interface ProvenanceBadgeProps {
  type: ProvenanceType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  // Normalize string to match ProvenanceType if needed
  const normalizedType = (type.toUpperCase().replace(/\s+/g, '_')) as ProvenanceType;
  const config = PROVENANCE_CONFIGS[normalizedType] || {
    label: type,
    classes: 'bg-slate-800 text-slate-300 border-slate-700',
    tooltip: 'Data provenance marker',
  };

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1 font-medium tracking-wide uppercase rounded border ${sizeClasses} ${config.classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
};
