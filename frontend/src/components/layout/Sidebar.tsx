import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Activity,
  ScanEye,
  SlidersHorizontal,
  Sparkles,
  FileText,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    description: 'Executive campus metrics',
  },
  {
    name: 'Campus Twin',
    path: '/campus-twin',
    icon: Building2,
    description: 'Interactive virtual campus',
  },
  {
    name: 'Monitoring',
    path: '/monitoring',
    icon: Activity,
    description: 'Telemetry trends & sensors',
  },
  {
    name: 'Vision Inspector',
    path: '/vision-inspector',
    icon: ScanEye,
    description: 'CV image analysis & review',
  },
  {
    name: 'Simulations',
    path: '/simulations',
    icon: SlidersHorizontal,
    description: 'Sustainability Time Machine',
  },
  {
    name: 'AI Advisor',
    path: '/ai-advisor',
    icon: Sparkles,
    description: 'Grok reasoning & insights',
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: FileText,
    description: 'Executive audit reports',
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 backdrop-blur-sm flex flex-col shrink-0">
      <div className="p-4 flex-1">
        <p className="text-[10px] uppercase font-mono font-semibold text-slate-400 px-3 mb-2 tracking-wider">
          Navigation
        </p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm shadow-cyan-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="flex flex-col text-left">
                      <span>{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {item.description}
                      </span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">EcoTwin Impact Engine</p>
        <p className="text-[10px] mt-0.5">Physical Twin &bull; Vision &bull; Deterministic Sim &bull; Grok</p>
      </div>
    </aside>
  );
};
