import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Trash2,
  PieChart,
  Building2,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Camera,
  RefreshCw,
  Inbox,
  ShieldAlert,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { campusApi } from '@/services/api/campusApi';
import { CampusOverview, BuildingSummary } from '@/types/campus';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<CampusOverview | null>(null);
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const fetchCampusData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, buildingsRes] = await Promise.all([
        campusApi.getOverview(),
        campusApi.getBuildings(),
      ]);
      setOverview(overviewRes);
      setBuildings(buildingsRes || []);
    } catch (err: unknown) {
      setOverview(null);
      setBuildings([]);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('Failed to retrieve campus telemetry from backend'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampusData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Querying campus sustainability telemetry..." size="lg" />;
  }

  const metrics = overview?.metrics;
  const statusSummary = overview?.status_summary;
  const hasData = overview !== null && buildings.length > 0;

  const handleBuildingKey = (e: React.KeyboardEvent, buildingId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/campus-twin?building=${buildingId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Dependency Banner when endpoints return 404 or connection error */}
      {error && (
        <DependencyNotice
          endpoint="/api/campus & /api/buildings"
          method="GET"
          owner="Person 2 (Digital Twin & Telemetry Persistence)"
          description="Awaiting backend campus telemetry aggregation routes. When deployed by Person 2, verified campus telemetry will populate automatically."
          error={error}
          onRetry={fetchCampusData}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Campus Sustainability Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Executive bird&apos;s-eye telemetry, 2.5D spatial Digital Twin status, and integrated decision workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasData ? (
            <>
              <ProvenanceBadge type={overview.provenance?.energy || 'simulated'} />
              <ProvenanceBadge type="calculated" />
            </>
          ) : (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
              Awaiting Telemetry Ingestion
            </span>
          )}
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Energy */}
        <div className="glass-panel p-5 relative overflow-hidden transition-all duration-150 hover:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Energy (24h)</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {metrics ? (
                  <>
                    {metrics.total_energy_kwh.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-cyan-400">kWh</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-mono text-xl">-- kWh</span>
                )}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            {metrics ? (
              <ProvenanceBadge type={overview?.provenance?.energy || 'simulated'} size="sm" />
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">No data</span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">3 Facilities</span>
          </div>
        </div>

        {/* Total Water */}
        <div className="glass-panel p-5 relative overflow-hidden transition-all duration-150 hover:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Water (24h)</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {metrics ? (
                  <>
                    {metrics.total_water_litres.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-sky-400">L</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-mono text-xl">-- L</span>
                )}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            {metrics ? (
              <ProvenanceBadge type={overview?.provenance?.water || 'simulated'} size="sm" />
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">No data</span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">Volume flow</span>
          </div>
        </div>

        {/* Total Waste */}
        <div className="glass-panel p-5 relative overflow-hidden transition-all duration-150 hover:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Waste (24h)</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {metrics ? (
                  <>
                    {metrics.total_waste_kg.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-amber-400">kg</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-mono text-xl">-- kg</span>
                )}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            {metrics ? (
              <ProvenanceBadge type={overview?.provenance?.waste || 'simulated'} size="sm" />
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">No data</span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">Disposed mass</span>
          </div>
        </div>

        {/* Segregation Rate */}
        <div className="glass-panel p-5 relative overflow-hidden transition-all duration-150 hover:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Segregation Rate</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {metrics ? (
                  <>
                    {metrics.waste_segregation_rate_percent.toFixed(1)}
                    <span className="text-sm font-normal text-emerald-400">%</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-mono text-xl">-- %</span>
                )}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            {metrics ? (
              <ProvenanceBadge type="calculated" size="sm" />
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">No data</span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">Calculated fraction</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map Outline + Workflow Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2.5D Campus Twin Map Vector Preview (Left 2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Interactive Campus Digital Twin
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Isometric 2.5D coordinate projection &bull; Select a building to inspect telemetry
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/campus-twin')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40"
            >
              Open Full Twin <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Map Canvas with Accessible Polygons */}
          <div className="w-full h-80 rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 relative flex items-center justify-center overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="region"
              aria-label="Campus 2.5D Topology Map"
            >
              {/* Campus Grid Background */}
              <defs>
                <pattern id="campusGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="600" height="300" fill="url(#campusGrid)" />

              {/* Campus Walkways */}
              <path
                d="M 50 150 Q 250 140 320 200 T 550 180"
                stroke="#334155"
                strokeWidth="4"
                strokeDasharray="4 4"
                fill="none"
              />

              {/* Building 1: ACADEMIC BLOCK */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Navigate to Academic Block Digital Twin"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => navigate('/campus-twin?building=ACADEMIC')}
                onKeyDown={(e) => handleBuildingKey(e, 'ACADEMIC')}
                onMouseEnter={() => setHoveredBuilding('ACADEMIC')}
                onMouseLeave={() => setHoveredBuilding(null)}
              >
                <polygon
                  points="80,100 170,60 220,110 130,150"
                  className={`transition-colors duration-150 ${
                    hoveredBuilding === 'ACADEMIC'
                      ? 'fill-cyan-950/90 stroke-cyan-300 stroke-[2.5]'
                      : 'fill-slate-900/90 stroke-cyan-500/80 stroke-[1.5]'
                  }`}
                />
                <polygon
                  points="130,150 220,110 220,140 130,180"
                  className="fill-slate-950/90 stroke-cyan-600/40"
                  strokeWidth="1"
                />
                <circle cx="150" cy="105" r="5" className="fill-cyan-400" />
                <text x="150" y="85" textAnchor="middle" className="fill-slate-200 text-[11px] font-bold font-mono">
                  ACADEMIC BLOCK
                </text>
                <text x="150" y="130" textAnchor="middle" className="fill-cyan-400 text-[10px] font-mono">
                  {buildings.find((b) => b.id === 'ACADEMIC')?.metrics.energy_consumption_kwh
                    ? `${buildings.find((b) => b.id === 'ACADEMIC')?.metrics.energy_consumption_kwh} kWh`
                    : 'Facility: ACADEMIC'}
                </text>
              </g>

              {/* Building 2: LIBRARY (LIB) */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Navigate to Library Digital Twin"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => navigate('/campus-twin?building=LIB')}
                onKeyDown={(e) => handleBuildingKey(e, 'LIB')}
                onMouseEnter={() => setHoveredBuilding('LIB')}
                onMouseLeave={() => setHoveredBuilding(null)}
              >
                <polygon
                  points="260,80 360,40 400,90 300,130"
                  className={`transition-colors duration-150 ${
                    hoveredBuilding === 'LIB'
                      ? 'fill-amber-950/90 stroke-amber-300 stroke-[2.5]'
                      : 'fill-slate-900/90 stroke-amber-500/80 stroke-[1.5]'
                  }`}
                />
                <polygon
                  points="300,130 400,90 400,120 300,160"
                  className="fill-slate-950/90 stroke-amber-600/40"
                  strokeWidth="1"
                />
                <circle cx="330" cy="85" r="5" className="fill-amber-400 animate-pulse" />
                <text x="330" y="65" textAnchor="middle" className="fill-slate-200 text-[11px] font-bold font-mono">
                  LIBRARY (LIB)
                </text>
                <text x="330" y="110" textAnchor="middle" className="fill-amber-400 text-[10px] font-mono">
                  {buildings.find((b) => b.id === 'LIB')?.metrics.energy_consumption_kwh
                    ? `${buildings.find((b) => b.id === 'LIB')?.metrics.energy_consumption_kwh} kWh`
                    : 'Facility: LIB'}
                </text>
              </g>

              {/* Building 3: STUDENT RESIDENCE */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Navigate to Student Residence Digital Twin"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => navigate('/campus-twin?building=RESIDENCE')}
                onKeyDown={(e) => handleBuildingKey(e, 'RESIDENCE')}
                onMouseEnter={() => setHoveredBuilding('RESIDENCE')}
                onMouseLeave={() => setHoveredBuilding(null)}
              >
                <polygon
                  points="420,130 510,90 550,140 460,180"
                  className={`transition-colors duration-150 ${
                    hoveredBuilding === 'RESIDENCE'
                      ? 'fill-cyan-950/90 stroke-cyan-300 stroke-[2.5]'
                      : 'fill-slate-900/90 stroke-cyan-500/80 stroke-[1.5]'
                  }`}
                />
                <polygon
                  points="460,180 550,140 550,170 460,210"
                  className="fill-slate-950/90 stroke-cyan-600/40"
                  strokeWidth="1"
                />
                <circle cx="485" cy="135" r="5" className="fill-cyan-400" />
                <text x="485" y="115" textAnchor="middle" className="fill-slate-200 text-[11px] font-bold font-mono">
                  RESIDENCE
                </text>
                <text x="485" y="160" textAnchor="middle" className="fill-cyan-400 text-[10px] font-mono">
                  {buildings.find((b) => b.id === 'RESIDENCE')?.metrics.energy_consumption_kwh
                    ? `${buildings.find((b) => b.id === 'RESIDENCE')?.metrics.energy_consumption_kwh} kWh`
                    : 'Facility: RESIDENCE'}
                </text>
              </g>
            </svg>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> ACADEMIC
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> LIB
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> RESIDENCE
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-1">
            <span>Coordinate Frame: DSU Virtual Campus (2.5D Projection)</span>
            <span>Click or press Enter on any facility polygon to view Digital Twin</span>
          </div>
        </div>

        {/* Quick Workflow Hub & Issues Overview (Right 1 Col) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Observation Summary Card */}
          <div className="glass-panel p-5">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Observations Register</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-300">Requires Review</span>
                <span className="font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                  {statusSummary?.requires_review_count ?? '--'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-300">Confirmed Issues</span>
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                  {statusSummary?.confirmed_issues_count ?? '--'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/vision-inspector')}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Upload CV Image for Inspection
            </button>
          </div>

          {/* Quick Action Workflows */}
          <div className="glass-panel p-5">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3">
              Impact Engine Workflows
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/simulations')}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-800/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      Sustainability Time Machine
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-6">
                  Simulate what-if operational interventions
                </p>
              </button>

              <button
                onClick={() => navigate('/ai-advisor')}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-violet-800/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                      Grok AI Recommendations
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-6">
                  Grounded explanations and priority scoring
                </p>
              </button>

              <button
                onClick={() => navigate('/monitoring')}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-800/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      Resource Monitoring
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-6">
                  Telemetry streams for energy, water, and waste
                </p>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
                      Sustainability Reports
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-6">
                  Compile executive audit documents
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Cards Row */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Campus Facilities Status (GET /api/buildings)
          </h3>
          <button
            onClick={fetchCampusData}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
            title="Refresh campus data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {buildings.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">No facility records currently returned by backend</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When Person 2 implements the building domain models and exposes <code>GET /api/buildings</code>, facilities will render here with verified resource metrics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buildings.map((b) => (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                aria-label={`Open Digital Twin for ${b.name}`}
                onClick={() => navigate(`/campus-twin?building=${b.id}`)}
                onKeyDown={(e) => handleBuildingKey(e, b.id)}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:bg-slate-900/60 flex flex-col justify-between focus:outline-none focus:border-cyan-500"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{b.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        ID: {b.id} &bull; {b.building_type}
                      </span>
                    </div>
                    {b.requires_review_count > 0 ? (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono font-semibold animate-pulse">
                        Review Pending
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono font-semibold">
                        Nominal
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Energy</p>
                      <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                        {b.metrics.energy_consumption_kwh}k
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Water</p>
                      <p className="text-xs font-mono font-bold text-sky-400 mt-0.5">
                        {b.metrics.water_volume_litres}L
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Waste</p>
                      <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                        {b.metrics.waste_fill_level_percent}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400">
                  <span>Open Facility Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
