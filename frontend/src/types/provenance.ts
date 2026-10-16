export type ProvenanceType =
  | 'MEASURED'
  | 'REAL'
  | 'SIMULATED'
  | 'MANUAL'
  | 'OBSERVED'
  | 'REVIEW_PENDING'
  | 'CONFIRMED'
  | 'CALCULATED'
  | 'PROJECTED'
  | 'AI_GENERATED';

export interface ProvenanceConfig {
  label: string;
  classes: string;
  tooltip: string;
}

export const PROVENANCE_CONFIGS: Record<ProvenanceType, ProvenanceConfig> = {
  MEASURED: {
    label: 'Real Sensor',
    classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    tooltip: 'Physical IoT hardware sensor reading',
  },
  REAL: {
    label: 'Real Sensor',
    classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    tooltip: 'Physical IoT hardware sensor reading',
  },
  SIMULATED: {
    label: 'Simulated',
    classes: 'bg-sky-950/80 text-sky-300 border-sky-700/50',
    tooltip: 'Synthetically generated bounded sensor telemetry stream',
  },
  MANUAL: {
    label: 'Manual Log',
    classes: 'bg-blue-950/80 text-blue-300 border-blue-700/50',
    tooltip: 'Operator-entered baseline value or manual reading',
  },
  OBSERVED: {
    label: 'Vision Inference',
    classes: 'bg-amber-950/80 text-amber-300 border-amber-700/50',
    tooltip: 'Automated Computer Vision model detection output',
  },
  REVIEW_PENDING: {
    label: 'Requires Review',
    classes: 'bg-amber-900/90 text-amber-200 border-amber-500 animate-pulse',
    tooltip: 'Unconfirmed observation awaiting facility operator review',
  },
  CONFIRMED: {
    label: 'Confirmed Issue',
    classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-600',
    tooltip: 'Human-verified sustainability incident linked to digital twin',
  },
  CALCULATED: {
    label: 'Deterministic Math',
    classes: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50',
    tooltip: 'Pure backend deterministic calculation (reproducible rule)',
  },
  PROJECTED: {
    label: 'Simulation Projection',
    classes: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50',
    tooltip: 'Sustainability Time Machine what-if scenario projection',
  },
  AI_GENERATED: {
    label: 'Grok AI Explanation',
    classes: 'bg-violet-950/80 text-violet-300 border-violet-700/50',
    tooltip: 'Grok-synthesized explanation grounded strictly in campus data',
  },
};
