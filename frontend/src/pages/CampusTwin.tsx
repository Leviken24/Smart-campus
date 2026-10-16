import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  Zap,
  Droplets,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Compass,
  Activity,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { campusApi } from '@/services/api/campusApi';
import { observationApi } from '@/services/api/observationApi';
import { BuildingDetail, SensorItem } from '@/types/campus';
import { ObservationItem } from '@/types/observation';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

interface BuildingMeta {
  id: 'LIB' | 'ACADEMIC' | 'RESIDENCE';
  name: string;
  type: string;
  defaultHours: string;
  description: string;
  baselineEnergyKwh: number;
  baselineWaterLitres: number;
  baselineWasteKg: number;
  sensors: SensorItem[];
  mapCoords: {
    pinX: number;
    pinY: number;
    labelX: number;
    labelY: number;
  };
}

const BUILDINGS_LIST: BuildingMeta[] = [
  {
    id: 'ACADEMIC',
    name: 'Academic Block',
    type: 'Classrooms & Research Laboratories',
    defaultHours: '07:30 - 20:30 (13 hrs/day)',
    description: 'Primary lecture theatres, seminar halls, and departmental research laboratories with high daytime power density.',
    baselineEnergyKwh: 650.0,
    baselineWaterLitres: 3100.0,
    baselineWasteKg: 180.0,
    sensors: [
      { id: 'ENERGY-ACAD-01', metric: 'energy_consumption', unit: 'kWh', status: 'online', source: 'simulated' },
      { id: 'WATER-ACAD-01', metric: 'water_volume', unit: 'L', status: 'online', source: 'simulated' },
      { id: 'WASTE-ACAD-01', metric: 'waste_fill_level', unit: '%', status: 'online', source: 'simulated' },
    ],
    mapCoords: {
      pinX: 170,
      pinY: 105,
      labelX: 170,
      labelY: 90,
    },
  },
  {
    id: 'LIB',
    name: 'Library',
    type: 'Academic & Study Commons',
    defaultHours: '08:00 - 22:00 (14 hrs/day)',
    description: 'Central campus library facility housing quiet study commons, book repositories, and computer workstations.',
    baselineEnergyKwh: 340.2,
    baselineWaterLitres: 1200.0,
    baselineWasteKg: 85.0,
    sensors: [
      { id: 'ENERGY-LIB-01', metric: 'energy_consumption', unit: 'kWh', status: 'online', source: 'simulated' },
      { id: 'WATER-LIB-01', metric: 'water_volume', unit: 'L', status: 'online', source: 'simulated' },
      { id: 'WASTE-LIB-01', metric: 'waste_fill_level', unit: '%', status: 'online', source: 'simulated' },
    ],
    mapCoords: {
      pinX: 360,
      pinY: 85,
      labelX: 360,
      labelY: 70,
    },
  },
  {
    id: 'RESIDENCE',
    name: 'Student Residence',
    type: 'Housing & Dining Wing',
    defaultHours: '24/7 Continuous Operation',
    description: 'Undergraduate student housing wings, common rooms, central dining facilities, and round-the-clock water and power use.',
    baselineEnergyKwh: 430.3,
    baselineWaterLitres: 4150.0,
    baselineWasteKg: 140.0,
    sensors: [
      { id: 'ENERGY-RES-01', metric: 'energy_consumption', unit: 'kWh', status: 'online', source: 'simulated' },
      { id: 'WATER-RES-01', metric: 'water_volume', unit: 'L', status: 'online', source: 'simulated' },
      { id: 'WASTE-RES-01', metric: 'waste_fill_level', unit: '%', status: 'online', source: 'simulated' },
    ],
    mapCoords: {
      pinX: 525,
      pinY: 135,
      labelX: 525,
      labelY: 120,
    },
  },
];

type LayerFilter = 'all' | 'energy' | 'water' | 'waste';

export const CampusTwin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const buildingParam = searchParams.get('building');
  const currentBuildingId: 'LIB' | 'ACADEMIC' | 'RESIDENCE' =
    buildingParam === 'ACADEMIC' || buildingParam === 'RESIDENCE' ? buildingParam : 'LIB';

  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<BuildingDetail | null>(null);
  const [allObservations, setAllObservations] = useState<ObservationItem[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [hoveredPolygon, setHoveredPolygon] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerFilter>('all');

  const selectedBuildingMeta = useMemo(
    () => BUILDINGS_LIST.find((b) => b.id === currentBuildingId) || BUILDINGS_LIST[0],
    [currentBuildingId]
  );

  const fetchBuildingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query observations from live backend (always query independently so CV observations render even if building endpoint is pending)
      try {
        const obsRes = await observationApi.getObservations();
        setAllObservations(obsRes || []);
      } catch (obsErr) {
        console.warn('Observations query non-critical error:', obsErr);
      }

      // Query single building digital twin endpoint
      const buildingRes = await campusApi.getBuilding(currentBuildingId);
      setDetail(buildingRes);
    } catch (err: unknown) {
      setDetail(null);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(`Failed to query building detail for ${currentBuildingId}`));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildingData();
  }, [currentBuildingId]);

  const handleSelectBuilding = (id: string) => {
    setSearchParams({ building: id });
  };

  const handlePolygonKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectBuilding(id);
    }
  };

  // Group observations by building ID
  const observationsByBuilding = useMemo(() => {
    const map: Record<string, ObservationItem[]> = {
      ACADEMIC: [],
      LIB: [],
      RESIDENCE: [],
    };
    allObservations.forEach((obs) => {
      const bId = (obs.building_id || '').toUpperCase();
      if (map[bId]) {
        map[bId].push(obs);
      }
    });
    return map;
  }, [allObservations]);

  // Observations for the currently selected facility
  const selectedBuildingObservations = useMemo(() => {
    return observationsByBuilding[currentBuildingId] || [];
  }, [observationsByBuilding, currentBuildingId]);

  // Effective metrics: use backend detail if available, otherwise fallback to calibrated baseline profile with clear provenance
  const activeMetrics = useMemo(() => {
    if (detail) {
      return {
        energy: detail.baseline_metrics.energy_daily_kwh,
        water: detail.baseline_metrics.water_daily_litres,
        waste: detail.baseline_metrics.waste_daily_kg,
        isLive: true,
      };
    }
    return {
      energy: selectedBuildingMeta.baselineEnergyKwh,
      water: selectedBuildingMeta.baselineWaterLitres,
      waste: selectedBuildingMeta.baselineWasteKg,
      isLive: false,
    };
  }, [detail, selectedBuildingMeta]);

  // Active sensors: use backend detail if available, otherwise baseline registered sensors
  const activeSensors = useMemo(() => {
    if (detail && detail.sensors && detail.sensors.length > 0) {
      return detail.sensors;
    }
    return selectedBuildingMeta.sensors;
  }, [detail, selectedBuildingMeta]);

  return (
    <div className="space-y-6">
      {/* Backend Dependency Banner */}
      {error && (
        <DependencyNotice
          endpoint={`/api/buildings/${currentBuildingId}`}
          method="GET"
          owner="Person 2 (Digital Twin & Sensors Lead)"
          description={`Awaiting single-facility Digital Twin endpoint for ${currentBuildingId}. Rendering verified campus baseline profile and live Computer Vision observations while backend endpoint is implemented.`}
          error={error}
          onRetry={fetchBuildingData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
              CAMPUS TWIN
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Interactive 2.5D Topology & Telemetry
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2 mt-1">
            <Building2 className="w-6 h-6 text-cyan-400" />
            Interactive Campus Digital Twin
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore 2.5D campus topology, inspect verified sensor telemetry bindings, and track Computer Vision observations across campus facilities.
          </p>
        </div>

        {/* Building Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {BUILDINGS_LIST.map((b) => {
            const issueCount = observationsByBuilding[b.id]?.length || 0;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentBuildingId === b.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{b.name}</span>
                {issueCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      currentBuildingId === b.id
                        ? 'bg-slate-950 text-amber-300'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                    }`}
                  >
                    {issueCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Layout: Interactive Map Canvas (Left 7 Cols) + Detail Inspector Panel (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between min-h-[500px]">
          {/* Map Controls & Layer Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Spatial Campus Map
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Active Selection: <span className="text-cyan-400 font-bold">{selectedBuildingMeta.name} ({currentBuildingId})</span>
              </p>
            </div>

            {/* Layer Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setActiveLayer('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeLayer === 'all'
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Dimensions
              </button>
              <button
                onClick={() => setActiveLayer('energy')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  activeLayer === 'energy'
                    ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-cyan-400" /> Energy
              </button>
              <button
                onClick={() => setActiveLayer('water')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  activeLayer === 'water'
                    ? 'bg-sky-950 text-sky-300 font-semibold border border-sky-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplets className="w-3 h-3 text-sky-400" /> Water
              </button>
              <button
                onClick={() => setActiveLayer('waste')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  activeLayer === 'waste'
                    ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-3 h-3 text-amber-400" /> Waste
              </button>
            </div>
          </div>

          {/* Interactive SVG Campus Layout */}
          <div className="w-full flex-1 rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 relative flex items-center justify-center overflow-hidden">
            <svg
              className="w-full h-full min-h-[340px]"
              viewBox="0 0 650 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="region"
              aria-label="2.5D Campus Isometric Topology"
            >
              {/* Background Grid Pattern */}
              <defs>
                <pattern id="twinGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <radialGradient id="acadGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="libGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="resGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="650" height="360" fill="url(#twinGrid)" />

              {/* Campus Inter-Facility Pathways */}
              <path
                d="M 60 190 Q 250 160 350 220 T 600 190"
                stroke="#334155"
                strokeWidth="5"
                strokeDasharray="6 6"
                fill="none"
              />
              <path
                d="M 210 150 Q 280 200 340 180"
                stroke="#334155"
                strokeWidth="3"
                strokeDasharray="4 4"
                fill="none"
              />

              {/* ============================================================ */}
              {/* Building 1: ACADEMIC BLOCK */}
              {/* ============================================================ */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Select Academic Block"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => handleSelectBuilding('ACADEMIC')}
                onKeyDown={(e) => handlePolygonKey(e, 'ACADEMIC')}
                onMouseEnter={() => setHoveredPolygon('ACADEMIC')}
                onMouseLeave={() => setHoveredPolygon(null)}
              >
                {/* Selection Halo Glow */}
                {currentBuildingId === 'ACADEMIC' && (
                  <ellipse cx="170" cy="140" rx="90" ry="55" fill="url(#acadGlow)" />
                )}

                {/* Left Shadow Facet */}
                <polygon
                  points="90,120 150,180 150,225 90,165"
                  className="fill-slate-950 stroke-slate-800 stroke-[1]"
                />
                {/* Front Facet */}
                <polygon
                  points="150,180 250,130 250,175 150,225"
                  className="fill-slate-900/95 stroke-slate-800 stroke-[1]"
                />
                {/* Top Roof Facet */}
                <polygon
                  points="90,120 190,70 250,130 150,180"
                  className={`transition-colors duration-150 ${
                    currentBuildingId === 'ACADEMIC'
                      ? 'fill-cyan-950/95 stroke-cyan-400 stroke-[3]'
                      : hoveredPolygon === 'ACADEMIC'
                      ? 'fill-slate-800/90 stroke-cyan-400 stroke-[2]'
                      : 'fill-slate-900/90 stroke-slate-700 stroke-[1.5]'
                  }`}
                />

                {/* Building Roof Details */}
                <polygon points="120,125 150,110 180,140 150,155" fill="#1e293b" opacity="0.6" />
                <circle cx="170" cy="125" r="5" className="fill-cyan-400" />

                {/* Building Name & ID Label */}
                <text x="170" y="95" textAnchor="middle" className="fill-slate-100 text-[11px] font-bold font-mono">
                  ACADEMIC BLOCK
                </text>
                <text x="170" y="150" textAnchor="middle" className="fill-cyan-400 text-[9px] font-mono">
                  ID: ACADEMIC
                </text>

                {/* Active Layer Metric Indicator Badge */}
                {activeLayer === 'energy' && (
                  <g transform="translate(110, 50)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      ⚡ 650 kWh (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'water' && (
                  <g transform="translate(110, 50)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      💧 3,100 L (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'waste' && (
                  <g transform="translate(110, 50)">
                    <rect width="120" height="20" rx="6" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#fcd34d" fontSize="10" fontFamily="monospace">
                      🗑️ 180 kg (Simulated)
                    </text>
                  </g>
                )}

                {/* Observation Issue Pin (If active observations exist) */}
                {observationsByBuilding.ACADEMIC.length > 0 && (
                  <g transform="translate(230, 90)">
                    <circle cx="10" cy="10" r="10" className="fill-amber-500 animate-pulse" />
                    <text x="10" y="14" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">
                      {observationsByBuilding.ACADEMIC.length}
                    </text>
                  </g>
                )}
              </g>

              {/* ============================================================ */}
              {/* Building 2: CENTRAL LIBRARY */}
              {/* ============================================================ */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Select Library"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => handleSelectBuilding('LIB')}
                onKeyDown={(e) => handlePolygonKey(e, 'LIB')}
                onMouseEnter={() => setHoveredPolygon('LIB')}
                onMouseLeave={() => setHoveredPolygon(null)}
              >
                {/* Selection Halo Glow */}
                {currentBuildingId === 'LIB' && (
                  <ellipse cx="360" cy="120" rx="95" ry="60" fill="url(#libGlow)" />
                )}

                {/* Left Shadow Facet */}
                <polygon
                  points="280,100 330,160 330,205 280,145"
                  className="fill-slate-950 stroke-slate-800 stroke-[1]"
                />
                {/* Front Facet */}
                <polygon
                  points="330,160 440,110 440,155 330,205"
                  className="fill-slate-900/95 stroke-slate-800 stroke-[1]"
                />
                {/* Top Roof Facet */}
                <polygon
                  points="280,100 390,50 440,110 330,160"
                  className={`transition-colors duration-150 ${
                    currentBuildingId === 'LIB'
                      ? 'fill-amber-950/95 stroke-amber-400 stroke-[3]'
                      : hoveredPolygon === 'LIB'
                      ? 'fill-slate-800/90 stroke-amber-400 stroke-[2]'
                      : 'fill-slate-900/90 stroke-slate-700 stroke-[1.5]'
                  }`}
                />

                {/* Building Roof Details */}
                <polygon points="320,105 350,90 380,120 350,135" fill="#1e293b" opacity="0.6" />
                <circle cx="360" cy="105" r="5" className="fill-amber-400" />

                {/* Building Name & ID Label */}
                <text x="360" y="75" textAnchor="middle" className="fill-slate-100 text-[11px] font-bold font-mono">
                  LIBRARY (LIB)
                </text>
                <text x="360" y="130" textAnchor="middle" className="fill-amber-400 text-[9px] font-mono">
                  ID: LIB
                </text>

                {/* Active Layer Metric Indicator Badge */}
                {activeLayer === 'energy' && (
                  <g transform="translate(300, 30)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      ⚡ 340 kWh (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'water' && (
                  <g transform="translate(300, 30)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      💧 1,200 L (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'waste' && (
                  <g transform="translate(300, 30)">
                    <rect width="120" height="20" rx="6" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#fcd34d" fontSize="10" fontFamily="monospace">
                      🗑️ 85 kg (Simulated)
                    </text>
                  </g>
                )}

                {/* Observation Issue Pin (If active observations exist) */}
                {observationsByBuilding.LIB.length > 0 && (
                  <g transform="translate(420, 75)">
                    <circle cx="10" cy="10" r="10" className="fill-amber-500 animate-pulse" />
                    <text x="10" y="14" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">
                      {observationsByBuilding.LIB.length}
                    </text>
                  </g>
                )}
              </g>

              {/* ============================================================ */}
              {/* Building 3: STUDENT RESIDENCE */}
              {/* ============================================================ */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Select Student Residence"
                className="cursor-pointer transition-transform duration-150 focus:outline-none"
                onClick={() => handleSelectBuilding('RESIDENCE')}
                onKeyDown={(e) => handlePolygonKey(e, 'RESIDENCE')}
                onMouseEnter={() => setHoveredPolygon('RESIDENCE')}
                onMouseLeave={() => setHoveredPolygon(null)}
              >
                {/* Selection Halo Glow */}
                {currentBuildingId === 'RESIDENCE' && (
                  <ellipse cx="525" cy="170" rx="90" ry="55" fill="url(#resGlow)" />
                )}

                {/* Left Shadow Facet */}
                <polygon
                  points="450,150 500,210 500,255 450,195"
                  className="fill-slate-950 stroke-slate-800 stroke-[1]"
                />
                {/* Front Facet */}
                <polygon
                  points="500,210 600,160 600,205 500,255"
                  className="fill-slate-900/95 stroke-slate-800 stroke-[1]"
                />
                {/* Top Roof Facet */}
                <polygon
                  points="450,150 550,100 600,160 500,210"
                  className={`transition-colors duration-150 ${
                    currentBuildingId === 'RESIDENCE'
                      ? 'fill-cyan-950/95 stroke-cyan-400 stroke-[3]'
                      : hoveredPolygon === 'RESIDENCE'
                      ? 'fill-slate-800/90 stroke-cyan-400 stroke-[2]'
                      : 'fill-slate-900/90 stroke-slate-700 stroke-[1.5]'
                  }`}
                />

                {/* Building Roof Details */}
                <polygon points="480,155 510,140 540,170 510,185" fill="#1e293b" opacity="0.6" />
                <circle cx="525" cy="155" r="5" className="fill-cyan-400" />

                {/* Building Name & ID Label */}
                <text x="525" y="125" textAnchor="middle" className="fill-slate-100 text-[11px] font-bold font-mono">
                  STUDENT RESIDENCE
                </text>
                <text x="525" y="180" textAnchor="middle" className="fill-cyan-400 text-[9px] font-mono">
                  ID: RESIDENCE
                </text>

                {/* Active Layer Metric Indicator Badge */}
                {activeLayer === 'energy' && (
                  <g transform="translate(465, 80)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      ⚡ 430 kWh (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'water' && (
                  <g transform="translate(465, 80)">
                    <rect width="120" height="20" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      💧 4,150 L (Simulated)
                    </text>
                  </g>
                )}
                {activeLayer === 'waste' && (
                  <g transform="translate(465, 80)">
                    <rect width="120" height="20" rx="6" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                    <text x="60" y="14" textAnchor="middle" fill="#fcd34d" fontSize="10" fontFamily="monospace">
                      🗑️ 140 kg (Simulated)
                    </text>
                  </g>
                )}

                {/* Observation Issue Pin (If active observations exist) */}
                {observationsByBuilding.RESIDENCE.length > 0 && (
                  <g transform="translate(580, 120)">
                    <circle cx="10" cy="10" r="10" className="fill-amber-500 animate-pulse" />
                    <text x="10" y="14" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">
                      {observationsByBuilding.RESIDENCE.length}
                    </text>
                  </g>
                )}
              </g>
            </svg>

            {/* Bottom Status Overlay */}
            <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Active Focus:</span>
              <span className="text-cyan-400 font-bold">{selectedBuildingMeta.name} ({currentBuildingId})</span>
            </div>
          </div>

          {/* Coordinate Frame & Presentation Disclaimer */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 gap-1 font-mono">
            <span>Projection: DSU Isometric Campus (2.5D Presentation Layout)</span>
            <span className="text-slate-500">Click or press Enter on any polygon to switch focus</span>
          </div>
        </div>

        {/* Building Detail Inspector Panel (Right 5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between">
          {loading ? (
            <div className="py-16 text-center">
              <LoadingSpinner message="Querying digital twin state from backend..." />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Panel Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-100">{selectedBuildingMeta.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {currentBuildingId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedBuildingMeta.type}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedBuildingMeta.defaultHours}</span>
                </div>
              </div>

              {/* Baseline Daily Metrics */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
                    Baseline Daily Consumption
                  </h4>
                  <ProvenanceBadge type={activeMetrics.isLive ? 'real' : 'simulated'} size="sm" />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                    <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Energy</p>
                    <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                      {activeMetrics.energy.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                    <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Water</p>
                    <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                      {activeMetrics.water.toLocaleString()} L
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                    <Trash2 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Waste</p>
                    <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                      {activeMetrics.waste.toLocaleString()} kg
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Registered Sensors Table */}
              <div>
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                  Registered Telemetry Sensors ({activeSensors.length})
                </h4>
                {activeSensors.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center">
                    No hardware or simulated sensors registered for this facility.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {activeSensors.map((sensor) => (
                      <div
                        key={sensor.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-200 font-semibold">{sensor.id}</span>
                          <span className="text-[10px] text-slate-400">({sensor.metric})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProvenanceBadge type={sensor.source} size="sm" />
                          <span className="text-[10px] text-emerald-400 uppercase">
                            {sensor.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Observations / Incidents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Active Observations ({selectedBuildingObservations.length})
                  </h4>
                  <button
                    onClick={() => navigate(`/vision-inspector?building=${currentBuildingId}`)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add Observation</span>
                  </button>
                </div>
                {selectedBuildingObservations.length === 0 ? (
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center text-xs text-slate-500 italic">
                    No active observations recorded for this building. Use the Vision Inspector to analyze facility images.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedBuildingObservations.map((obs) => (
                      <div
                        key={obs.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-amber-800/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {obs.observation_type.replace(/_/g, ' ')}
                          </span>
                          <ProvenanceBadge type={obs.status} size="sm" />
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{obs.description}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                          <span>Source: {obs.source}</span>
                          <button
                            onClick={() => navigate('/vision-inspector')}
                            className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Workflow Action Bridges */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/monitoring?building=${currentBuildingId}`)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  View Resource Telemetry for {selectedBuildingMeta.name}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button
                  onClick={() => navigate(`/simulations?building=${currentBuildingId}`)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Launch What-If Simulation for {selectedBuildingMeta.name}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button
                  onClick={() => navigate(`/ai-advisor?building=${currentBuildingId}`)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-violet-950/80 hover:bg-violet-900/80 text-violet-300 border border-violet-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Ask Grok AI for Facility Recommendations
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
