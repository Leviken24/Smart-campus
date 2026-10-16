import React, { useEffect, useState } from 'react';
import { Leaf, Activity, Wifi, WifiOff } from 'lucide-react';
import { healthApi } from '@/services/api/healthApi';
import { HealthResponse } from '@/types/health';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Clock update
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Health polling
    const pollHealth = async () => {
      try {
        const data = await healthApi.checkHealth();
        setHealth(data);
        setIsBackendConnected(true);
      } catch {
        setIsBackendConnected(false);
      }
    };

    pollHealth();
    const healthInterval = setInterval(pollHealth, 15000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(healthInterval);
    };
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
            <Leaf className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-100">
              EcoTwin <span className="text-cyan-400">AI</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Sustainable Campus Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Local Time: {time || '--:--:--'}</span>
        </div>

        {/* Backend Connectivity Indicator */}
        <div
          title={
            isBackendConnected === true
              ? `Backend Connected (FastAPI v${health?.version || '1.0.0'})`
              : isBackendConnected === false
              ? 'Backend API Unreachable'
              : 'Checking backend connectivity...'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
            isBackendConnected === true
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : isBackendConnected === false
              ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          {isBackendConnected === true ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">API Online</span>
            </>
          ) : isBackendConnected === false ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">API Offline</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
