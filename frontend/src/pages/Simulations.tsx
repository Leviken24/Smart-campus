import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Zap,
  Droplets,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle,
  TrendingDown,
  DollarSign,
  Info,
  Inbox,
  History,
  Building2,
  Activity,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  Scale,
  Copy,
  Check,
  Split,
  Compass,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { simulationApi } from '@/services/api/simulationApi';
import {
  SimulationRequest,
  SimulationResponse,
  SimulationResource,
} from '@/types/simulation';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

interface BuildingProfile {
  id: string;
  name: string;
  type: string;
  operationalHours: string;
  description: string;
  typicalPowerKw: number;
  baselineHours: number;
  baselineLeakLpm: number;
  baselineWasteKg: number;
  baselineSegregation: number;
}

const BUILDINGS: BuildingProfile[] = [
  {
    id: 'LIB',
    name: 'Library',
    type: 'Academic & Study Commons',
    operationalHours: '08:00 - 22:00',
    description: 'High daytime study occupancy. Prime candidate for off-peak HVAC and lighting curtailment.',
    typicalPowerKw: 25.0,
    baselineHours: 14.0,
    baselineLeakLpm: 5.0,
    baselineWasteKg: 300.0,
    baselineSegregation: 0.45,
  },
  {
    id: 'ACADEMIC',
    name: 'Academic Block',
    type: 'Classrooms & Research Labs',
    operationalHours: '07:30 - 20:30',
    description: 'Specialized lab power demand, lecture hall heating/cooling, and heavy paper/packaging waste.',
    typicalPowerKw: 45.0,
    baselineHours: 13.0,
    baselineLeakLpm: 12.0,
    baselineWasteKg: 650.0,
    baselineSegregation: 0.35,
  },
  {
    id: 'RESIDENCE',
    name: 'Student Residence',
    type: 'Housing & Dining Wing',
    operationalHours: '24 Hours (Continuous)',
    description: 'Continuous baseline electrical loads, dining organic waste streams, and high plumbing usage.',
    typicalPowerKw: 35.0,
    baselineHours: 20.0,
    baselineLeakLpm: 8.0,
    baselineWasteKg: 450.0,
    baselineSegregation: 0.25,
  },
];

interface InterventionOption {
  id: string;
  label: string;
  description: string;
  formulaDescription: string;
}

const INTERVENTIONS: Record<SimulationResource, InterventionOption[]> = {
  energy: [
    {
      id: 'reduce_operating_hours',
      label: 'Curtail Operating Hours',
      description: 'Adjust HVAC and active lighting schedules to shut down during low-occupancy periods.',
      formulaDescription: 'ΔE = Power (kW) × (Baseline Hours - Proposed Hours) × Days',
    },
    {
      id: 'led_lighting_retrofit',
      label: 'LED Lighting Retrofit',
      description: 'Replace legacy fluorescent or HID fixtures with high-efficiency solid-state LED arrays.',
      formulaDescription: 'ΔE modeled via effective schedule & load optimization over operating days',
    },
  ],
  water: [
    {
      id: 'repair_pipe_leakage',
      label: 'Repair Pipeline Leakage',
      description: 'Isolate supply pipes, replace failed seals, and eliminate continuous passive flow loss.',
      formulaDescription: 'ΔV = (Baseline Flow Rate - Repaired Flow Rate) × Duration (mins)',
    },
    {
      id: 'fixture_retrofit',
      label: 'Low-Flow Aerator Retrofit',
      description: 'Install pressure-compensating flow restrictors across campus rest areas and faucets.',
      formulaDescription: 'ΔV modeled via aggregate fixture flow reduction over active periods',
    },
  ],
  waste: [
    {
      id: 'improve_segregation',
      label: 'Enhanced Source Segregation',
      description: 'Deploy multi-stream color-coded recycling receptacles and signage to increase diversion.',
      formulaDescription: 'ΔM = Total Waste (kg) × (Proposed Segregation - Baseline Segregation)',
    },
    {
      id: 'composting_diversion',
      label: 'Organic Waste Composting',
      description: 'Divert food waste and landscaping organic mass to campus decentralized composting.',
      formulaDescription: 'ΔM modeled via organic stream segregation and composting diversion fraction',
    },
  ],
};

export const Simulations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const buildingParam = searchParams.get('building');
  const resourceParam = searchParams.get('resource');
  const scenarioParam = searchParams.get('scenario');

  const initialBuilding = BUILDINGS.some((b) => b.id === buildingParam) ? (buildingParam as string) : 'LIB';
  const initialResource: SimulationResource =
    resourceParam === 'water' || resourceParam === 'waste' ? resourceParam : 'energy';

  // Selection state
  const [buildingId, setBuildingId] = useState<string>(initialBuilding);
  const [resourceType, setResourceType] = useState<SimulationResource>(initialResource);
  const [intervention, setIntervention] = useState<string>(INTERVENTIONS[initialResource][0].id);

  // Active visualization tab
  const [activeResultTab, setActiveResultTab] = useState<'comparison' | 'trajectory' | 'method'>('comparison');

  // Energy Parameters
  const [powerKw, setPowerKw] = useState<number>(25.0);
  const [baselineHours, setBaselineHours] = useState<number>(14.0);
  const [proposedHours, setProposedHours] = useState<number>(10.0);
  const [days, setDays] = useState<number>(30);
  const [tariff, setTariff] = useState<number>(0.12);

  // Water Parameters
  const [leakFlowRate, setLeakFlowRate] = useState<number>(5.0);
  const [leakDurationMins, setLeakDurationMins] = useState<number>(1440);
  const [repairedFlowRate, setRepairedFlowRate] = useState<number>(0.0);

  // Waste Parameters
  const [baselineWasteKg, setBaselineWasteKg] = useState<number>(300.0);
  const [baselineSegregation, setBaselineSegregation] = useState<number>(0.45);
  const [proposedSegregation, setProposedSegregation] = useState<number>(0.75);

  // UI & Execution State
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [simulationError, setSimulationError] = useState<ApiError | Error | null>(null);

  // Scenario History State
  const [historyList, setHistoryList] = useState<SimulationResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<ApiError | Error | null>(null);
  const [loadingHistoryItem, setLoadingHistoryItem] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync state if URL query params change externally
  useEffect(() => {
    if (buildingParam && BUILDINGS.some((b) => b.id === buildingParam) && buildingParam !== buildingId) {
      setBuildingId(buildingParam);
    }
    if (
      resourceParam &&
      (resourceParam === 'energy' || resourceParam === 'water' || resourceParam === 'waste') &&
      resourceParam !== resourceType
    ) {
      setResourceType(resourceParam);
      setIntervention(INTERVENTIONS[resourceParam][0].id);
    }
  }, [buildingParam, resourceParam]);

  // Handle URL scenario parameter if passed
  useEffect(() => {
    if (scenarioParam) {
      handleLoadScenario(scenarioParam);
    }
  }, [scenarioParam]);

  const selectedBuildingMeta = useMemo(
    () => BUILDINGS.find((b) => b.id === buildingId) || BUILDINGS[0],
    [buildingId]
  );

  const activeInterventionMeta = useMemo(
    () => INTERVENTIONS[resourceType].find((i) => i.id === intervention) || INTERVENTIONS[resourceType][0],
    [resourceType, intervention]
  );

  const handleBuildingChange = (newBuilding: string) => {
    setBuildingId(newBuilding);
    setSearchParams({ building: newBuilding, resource: resourceType });
  };

  const handleApplyFacilityDefaults = () => {
    const b = selectedBuildingMeta;
    setPowerKw(b.typicalPowerKw);
    setBaselineHours(b.baselineHours);
    setProposedHours(Math.max(1, b.baselineHours - 4));
    setDays(30);
    setTariff(0.12);
    setLeakFlowRate(b.baselineLeakLpm);
    setRepairedFlowRate(0.0);
    setLeakDurationMins(1440);
    setBaselineWasteKg(b.baselineWasteKg);
    setBaselineSegregation(b.baselineSegregation);
    setProposedSegregation(Math.min(0.95, b.baselineSegregation + 0.3));
  };

  const handleResourceChange = (newResource: SimulationResource) => {
    setResourceType(newResource);
    setIntervention(INTERVENTIONS[newResource][0].id);
    setSearchParams({ building: buildingId, resource: newResource });
  };

  // Fetch Historical Scenarios
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const list = await simulationApi.getSimulations(buildingId, resourceType);
      setHistoryList(list || []);
    } catch (err: unknown) {
      setHistoryList([]);
      if (err instanceof Error) {
        setHistoryError(err);
      } else {
        setHistoryError(new Error('Failed to retrieve simulation history.'));
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [buildingId, resourceType]);

  // Client-Side Input Validation (Defensive bounds verification)
  const validationError = useMemo((): string | null => {
    if (resourceType === 'energy') {
      if (powerKw <= 0) return 'Aggregate power load must be strictly greater than 0 kW.';
      if (powerKw > 500) return 'Aggregate power load exceeds maximum prototype limit (500 kW).';
      if (baselineHours <= 0 || baselineHours > 24) return 'Baseline hours must be between 1 and 24 hrs/day.';
      if (proposedHours < 0 || proposedHours > 24) return 'Proposed hours must be between 0 and 24 hrs/day.';
      if (proposedHours > baselineHours) return 'Proposed operating hours cannot exceed baseline hours.';
      if (days <= 0 || days > 365) return 'Operating period must be between 1 and 365 days.';
      if (tariff <= 0) return 'Electricity tariff must be positive ($/kWh).';
    } else if (resourceType === 'water') {
      if (leakFlowRate <= 0) return 'Baseline flow rate must be greater than 0 L/min.';
      if (leakFlowRate > 200) return 'Flow rate exceeds maximum plausible test threshold (200 L/min).';
      if (leakDurationMins <= 0) return 'Duration must be greater than 0 minutes.';
      if (leakDurationMins > 43200) return 'Duration cannot exceed 30 days (43,200 minutes).';
      if (repairedFlowRate < 0) return 'Repaired flow rate cannot be negative.';
      if (repairedFlowRate > leakFlowRate) return 'Repaired flow rate cannot exceed baseline flow rate.';
    } else if (resourceType === 'waste') {
      if (baselineWasteKg <= 0) return 'Total waste mass must be strictly greater than 0 kg.';
      if (baselineWasteKg > 50000) return 'Total waste mass exceeds single-cycle limit (50,000 kg).';
      if (baselineSegregation < 0 || baselineSegregation > 1) {
        return 'Baseline segregation fraction must be between 0.0 and 1.0 (0% - 100%).';
      }
      if (proposedSegregation < 0 || proposedSegregation > 1) {
        return 'Proposed segregation fraction must be between 0.0 and 1.0 (0% - 100%).';
      }
      if (proposedSegregation < baselineSegregation) {
        return 'Proposed segregation rate should be greater than or equal to baseline rate.';
      }
    }
    return null;
  }, [
    resourceType,
    powerKw,
    baselineHours,
    proposedHours,
    days,
    tariff,
    leakFlowRate,
    leakDurationMins,
    repairedFlowRate,
    baselineWasteKg,
    baselineSegregation,
    proposedSegregation,
  ]);

  // Execute Deterministic Backend Simulation
  const handleRunSimulation = async () => {
    if (validationError) return;

    try {
      setSimulating(true);
      setSimulationError(null);

      const requestPayload: SimulationRequest = {
        building_id: buildingId,
        resource_type: resourceType,
        intervention,
        baseline:
          resourceType === 'energy'
            ? {
                power_kw: powerKw,
                operating_hours_per_day: baselineHours,
                operating_days: days,
                baseline_energy_kwh: powerKw * baselineHours * days,
              }
            : resourceType === 'water'
            ? {
                leak_flow_rate_lpm: leakFlowRate,
                duration_minutes: leakDurationMins,
                baseline_water_litres: leakFlowRate * leakDurationMins,
              }
            : {
                baseline_waste_kg: baselineWasteKg,
                baseline_segregation_fraction: baselineSegregation,
              },
        parameters:
          resourceType === 'energy'
            ? {
                proposed_hours_per_day: proposedHours,
                electricity_tariff_per_kwh: tariff,
              }
            : resourceType === 'water'
            ? {
                repaired_flow_rate_lpm: repairedFlowRate,
              }
            : {
                proposed_segregation_fraction: proposedSegregation,
              },
      };

      const res = await simulationApi.runSimulation(requestPayload);
      setSimulationResult(res);
      await fetchHistory();
    } catch (err: unknown) {
      setSimulationResult(null);
      if (err instanceof Error) {
        setSimulationError(err);
      } else {
        setSimulationError(new Error('Failed to execute deterministic simulation on backend.'));
      }
    } finally {
      setSimulating(false);
    }
  };

  // Load a scenario from history by ID
  const handleLoadScenario = async (scenarioId: string) => {
    try {
      setLoadingHistoryItem(scenarioId);
      const res = await simulationApi.getSimulation(scenarioId);
      setSimulationResult(res);
      setBuildingId(res.building_id);
      setResourceType(res.resource_type);
      setIntervention(res.intervention);
    } catch (err: unknown) {
      const fallback = historyList.find((s) => s.scenario_id === scenarioId);
      if (fallback) {
        setSimulationResult(fallback);
        setBuildingId(fallback.building_id);
        setResourceType(fallback.resource_type);
        setIntervention(fallback.intervention);
      }
    } finally {
      setLoadingHistoryItem(null);
    }
  };

  const handleCopyScenarioId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleComparisonSelection = (scenarioId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(scenarioId)) {
        return prev.filter((id) => id !== scenarioId);
      }
      if (prev.length >= 2) {
        return [prev[1], scenarioId];
      }
      return [...prev, scenarioId];
    });
  };

  const handleResetDefaults = () => {
    setPowerKw(25.0);
    setBaselineHours(14.0);
    setProposedHours(10.0);
    setDays(30);
    setTariff(0.12);
    setLeakFlowRate(5.0);
    setRepairedFlowRate(0.0);
    setLeakDurationMins(1440);
    setBaselineWasteKg(300.0);
    setBaselineSegregation(0.45);
    setProposedSegregation(0.75);
    setSimulationResult(null);
    setSimulationError(null);
  };

  // Comparative Chart Data
  const chartData = simulationResult
    ? [
        {
          name: 'Baseline State (T-0)',
          value: simulationResult.baseline_value,
          fill: '#64748b',
        },
        {
          name: 'Projected Outcome (T+1)',
          value: simulationResult.projected_value,
          fill: '#06b6d4',
        },
        {
          name: 'Avoided / Conserved (Δ)',
          value: Math.max(0, simulationResult.absolute_savings),
          fill: '#10b981',
        },
      ]
    : [];

  // Trajectory Timeline Data (30-day projection modeling cumulative resource consumption)
  const trajectoryData = useMemo(() => {
    if (!simulationResult) return [];
    const points = [];
    const totalDays = 30;
    const dailyBaseline = simulationResult.baseline_value / totalDays;
    const dailyProjected = simulationResult.projected_value / totalDays;

    for (let day = 0; day <= totalDays; day += 5) {
      const dayNum = day === 0 ? 1 : day;
      const baseCum = Math.round(dailyBaseline * dayNum);
      const projCum = Math.round(dailyProjected * dayNum);
      points.push({
        day: `Day ${dayNum}`,
        Baseline: baseCum,
        Projected: projCum,
        Savings: Math.max(0, baseCum - projCum),
      });
    }
    return points;
  }, [simulationResult]);

  // Selected comparison items from history
  const comparisonScenarios = useMemo(() => {
    return historyList.filter((item) => selectedForComparison.includes(item.scenario_id));
  }, [historyList, selectedForComparison]);

  return (
    <div className="space-y-6">
      {/* Time Machine Signature Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
              SIGNATURE FEATURE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Deterministic Simulation Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2 mt-1">
            <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
            Sustainability Time Machine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore hypothetical operational interventions, model projected consumption reductions, and inspect deterministic engineering assumptions before capital deployment.
          </p>
        </div>

        {/* Workflow Quick Links & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/campus-twin?building=${buildingId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin</span>
          </button>

          <button
            onClick={() => navigate(`/monitoring?building=${buildingId}&resource=${resourceType}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry</span>
          </button>

          <ProvenanceBadge type="CALCULATED" size="sm" />
          <ProvenanceBadge type="PROJECTED" size="sm" />
        </div>
      </div>

      {/* Backend Dependency Banner for Run Simulation */}
      {simulationError && (
        <DependencyNotice
          endpoint="/api/simulations/run"
          method="POST"
          owner="Person 2 (Deterministic Simulation Engine Lead)"
          description="Awaiting deterministic backend calculation service. In accordance with project rules, the frontend strictly avoids calculating or fabricating simulation outcomes client-side."
          error={simulationError}
          onRetry={handleRunSimulation}
        />
      )}

      {/* Main Two-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Configuration Form (Left 5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                Intervention Configuration
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Parameters passed to backend deterministic models.
              </p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Reset default parameters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Target Facility Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Target Campus Facility
              </label>
              <button
                type="button"
                onClick={handleApplyFacilityDefaults}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                title="Load calibrated baseline profile for this building"
              >
                Apply Profile Defaults
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBuildingChange(b.id)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    buildingId === b.id
                      ? 'bg-slate-800 text-cyan-400 border-cyan-800/80 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{b.id}</div>
                  <div className="text-[10px] opacity-75 truncate">{b.name}</div>
                </button>
              ))}
            </div>

            {/* Selected Facility Context Callout */}
            <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">{selectedBuildingMeta.name}</span>{' '}
                <span className="text-[10px] text-slate-500">({selectedBuildingMeta.operationalHours})</span>: {selectedBuildingMeta.description}
              </div>
            </div>
          </div>

          {/* Resource Dimension Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Resource Dimension
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleResourceChange('energy')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  resourceType === 'energy'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Energy
              </button>
              <button
                type="button"
                onClick={() => handleResourceChange('water')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  resourceType === 'water'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" /> Water
              </button>
              <button
                type="button"
                onClick={() => handleResourceChange('waste')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  resourceType === 'waste'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Waste
              </button>
            </div>
          </div>

          {/* Specific Intervention Strategy Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Intervention Strategy
            </label>
            <select
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              {INTERVENTIONS[resourceType].map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              {activeInterventionMeta.description}
            </p>
          </div>

          {/* Dynamic Parameter Inputs (Based on Resource Schema & Contracts) */}
          {resourceType === 'energy' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Aggregate Power Load</span>
                  <span className="font-mono text-cyan-400 font-bold">{powerKw.toFixed(1)} kW</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="2.5"
                  value={powerKw}
                  onChange={(e) => setPowerKw(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Instantaneous active facility electrical load (kW)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Baseline Operating Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={baselineHours}
                    onChange={(e) => setBaselineHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Current schedule (hrs/day)</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Proposed Operating Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={proposedHours}
                    onChange={(e) => setProposedHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Curtailed target (hrs/day)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Scenario simulation horizon</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tariff ($/kWh)</label>
                  <input
                    type="number"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={tariff}
                    onChange={(e) => setTariff(parseFloat(e.target.value) || 0.12)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Configured electricity rate</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Computed Baseline Energy:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {(powerKw * baselineHours * days).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Formula: {activeInterventionMeta.formulaDescription}
                </div>
              </div>
            </div>
          )}

          {resourceType === 'water' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Baseline Flow Rate (L/min)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={leakFlowRate}
                  onChange={(e) => setLeakFlowRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500">Continuous passive flow rate (Litres per minute)</span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="43200"
                  step="60"
                  value={leakDurationMins}
                  onChange={(e) => setLeakDurationMins(parseInt(e.target.value) || 1440)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  {leakDurationMins} mins = {(leakDurationMins / 60).toFixed(1)} hours
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Target Repaired Flow Rate (L/min)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={repairedFlowRate}
                  onChange={(e) => setRepairedFlowRate(parseFloat(e.target.value) || 0.0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500">0.0 L/min indicates complete leak resolution</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Computed Baseline Volume:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {(leakFlowRate * leakDurationMins).toLocaleString()} L
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Formula: {activeInterventionMeta.formulaDescription}
                </div>
              </div>
            </div>
          )}

          {resourceType === 'waste' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Total Waste Mass Generated (kg)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={baselineWasteKg}
                  onChange={(e) => setBaselineWasteKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500">Cumulative facility waste generation cycle (kg)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Baseline Segregation Rate
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={baselineSegregation}
                    onChange={(e) => setBaselineSegregation(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">
                    {(baselineSegregation * 100).toFixed(0)}% diverted
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Proposed Segregation Rate
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={proposedSegregation}
                    onChange={(e) => setProposedSegregation(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">
                    {(proposedSegregation * 100).toFixed(0)}% target
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Computed Diverted Mass:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {(baselineWasteKg * proposedSegregation).toLocaleString()} kg
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Formula: {activeInterventionMeta.formulaDescription}
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Run Deterministic Simulation Action Button */}
          <button
            onClick={handleRunSimulation}
            disabled={simulating || Boolean(validationError)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <SlidersHorizontal className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Executing Deterministic Engine...' : 'Run Deterministic Simulation'}
          </button>
        </div>

        {/* Comparison Workspace (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {simulating ? (
            <div className="glass-panel p-12 text-center">
              <LoadingSpinner message="Calculating deterministic outcome via backend engine..." />
            </div>
          ) : simulationResult ? (
            <>
              {/* Baseline vs Scenario Temporal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Baseline Card (T-0) */}
                <div className="glass-panel p-5 space-y-2 border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Baseline State (T-0)
                    </span>
                    <ProvenanceBadge type="CALCULATED" size="sm" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-slate-200">
                    {simulationResult.baseline_value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                    <span className="text-xs font-normal text-slate-400">{simulationResult.unit}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Calculated baseline consumption for {selectedBuildingMeta.name} without intervention
                  </p>
                </div>

                {/* Projected Scenario Card (T+1) */}
                <div className="glass-panel p-5 space-y-2 border-cyan-800/60 bg-cyan-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      Projected Outcome (T+1)
                    </span>
                    <ProvenanceBadge type="PROJECTED" size="sm" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-cyan-400">
                    {simulationResult.projected_value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                    <span className="text-xs font-normal text-cyan-300">{simulationResult.unit}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Projected after operational intervention implementation
                  </p>
                </div>
              </div>

              {/* Delta Impact Indicators Trio */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <TrendingDown className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Resource Conserved</p>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {simulationResult.absolute_savings.toLocaleString(undefined, { maximumFractionDigits: 1 })} {simulationResult.unit}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Reduction Delta</p>
                  <p className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                    {simulationResult.baseline_value > 0
                      ? `${simulationResult.percentage_reduction.toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Avoided Utility Cost</p>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {simulationResult.estimated_cost_savings !== undefined
                      ? `$${simulationResult.estimated_cost_savings.toFixed(2)} ${simulationResult.currency || 'USD'}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Interactive Visualization Tabs Container */}
              <div className="glass-panel p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveResultTab('comparison')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        activeResultTab === 'comparison'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Comparative Impact
                    </button>
                    <button
                      onClick={() => setActiveResultTab('trajectory')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        activeResultTab === 'trajectory'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Time Machine Trajectory
                    </button>
                    <button
                      onClick={() => setActiveResultTab('method')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        activeResultTab === 'method'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Engineering Method & Assumptions
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <span>ID:</span>
                    <button
                      onClick={() => handleCopyScenarioId(simulationResult.scenario_id)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      title="Click to copy scenario identifier"
                    >
                      {simulationResult.scenario_id}
                      {copiedId === simulationResult.scenario_id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab 1: Direct BarChart Comparison */}
                {activeResultTab === 'comparison' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Unit: {simulationResult.unit}</span>
                      <span>Calculation Method: {simulationResult.calculation_method}</span>
                    </div>

                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" fontSize={11} unit={` ${simulationResult.unit}`} />
                          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={150} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#f8fafc',
                            }}
                            formatter={(val: number) => [`${val.toLocaleString()} ${simulationResult.unit}`, 'Magnitude']}
                          />
                          <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 2: 30-Day Cumulative Trajectory (Time Machine Future View) */}
                {activeResultTab === 'trajectory' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Cumulative Projected Consumption Horizon (30 Days)</span>
                      <span>Unit: {simulationResult.unit}</span>
                    </div>

                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trajectoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} unit={` ${simulationResult.unit}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#f8fafc',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                          <Area
                            type="monotone"
                            dataKey="Baseline"
                            stroke="#64748b"
                            fill="#334155"
                            fillOpacity={0.4}
                          />
                          <Area
                            type="monotone"
                            dataKey="Projected"
                            stroke="#06b6d4"
                            fill="#0891b2"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 italic text-center">
                      The diverging gap between baseline and projected area represents accumulating resource conservation over time.
                    </p>
                  </div>
                )}

                {/* Tab 3: Detailed Engineering Inspection & Assumptions */}
                {activeResultTab === 'method' && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Method Identifier</span>
                        <div className="text-xs font-mono font-semibold text-cyan-300">
                          {simulationResult.calculation_method}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Deterministic backend formula applied without external probabilistic drift.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Formula Rule</span>
                        <div className="text-xs font-mono font-semibold text-slate-200">
                          {activeInterventionMeta.formulaDescription}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Preserves unit dimensions and mathematical integrity.
                        </p>
                      </div>
                    </div>

                    {/* Stated Assumptions List */}
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        Backend Stated Assumptions:
                      </h5>
                      {simulationResult.assumptions && simulationResult.assumptions.length > 0 ? (
                        <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                          {simulationResult.assumptions.map((assump, idx) => (
                            <li key={idx}>{assump}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No explicit assumptions returned by engine.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Projection Integrity Disclaimer */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Data Integrity Principle:</span>{' '}
                  This calculation represents a simulated projected intervention generated from deterministic formulas. Projected savings are hypothetical until operational changes are implemented and verified via IoT telemetry.
                </div>

                {/* Workflow Bridge Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    Bridge scenario results into AI synthesis & reports:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/ai-advisor?scenario=${simulationResult.scenario_id}&building=${simulationResult.building_id}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-slate-100 transition-colors flex items-center gap-1.5 shadow-md shadow-violet-950/50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Explain with Grok
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/reports?scenario=${simulationResult.scenario_id}&building=${simulationResult.building_id}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Add to Report
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400 space-y-3">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-300">No Simulation Executed</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Configure intervention parameters on the left and click &quot;Run Deterministic Simulation&quot;. The backend will compute testable baseline vs projected outcomes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Scenario Side-by-Side Comparison Modal / Card (If 2 selected) */}
      {comparisonScenarios.length === 2 && (
        <div className="glass-panel p-6 border-cyan-700/60 bg-slate-900/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Multi-Scenario Head-to-Head Comparison
              </h3>
            </div>
            <button
              onClick={() => setSelectedForComparison([])}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparisonScenarios.map((scen, idx) => (
              <div
                key={scen.scenario_id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Scenario #{idx + 1}: {scen.scenario_id}
                  </span>
                  <ProvenanceBadge type="PROJECTED" size="sm" />
                </div>
                <div className="text-xs text-slate-300 font-semibold capitalize">
                  {scen.intervention.replace(/_/g, ' ')} ({scen.building_id})
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Baseline</span>
                    <span className="text-slate-200">
                      {scen.baseline_value.toLocaleString()} {scen.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Projected</span>
                    <span className="text-cyan-300 font-bold">
                      {scen.projected_value.toLocaleString()} {scen.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Savings</span>
                    <span className="text-emerald-400 font-bold">
                      {scen.absolute_savings.toLocaleString()} {scen.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avoided Cost</span>
                    <span className="text-emerald-400 font-bold">
                      {scen.estimated_cost_savings !== undefined
                        ? `$${scen.estimated_cost_savings.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-cyan-400" />
              Comparative Net Delta:
            </span>
            <span className="font-mono font-bold text-slate-100">
              Difference of{' '}
              {Math.abs(
                comparisonScenarios[0].absolute_savings - comparisonScenarios[1].absolute_savings
              ).toLocaleString()}{' '}
              {comparisonScenarios[0].unit} in projected savings
            </span>
          </div>
        </div>
      )}

      {/* Scenario History Section */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Saved Scenarios History
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({selectedBuildingMeta.name} — {resourceType.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedForComparison.length > 0 && (
              <span className="text-[11px] font-mono text-cyan-400">
                {selectedForComparison.length} of 2 selected for comparison
              </span>
            )}
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>
        </div>

        {/* History Dependency Notice */}
        {historyError && (
          <DependencyNotice
            endpoint="/api/simulations"
            method="GET"
            owner="Person 2 (Deterministic Simulation Engine Lead)"
            description="Awaiting scenario history persistence endpoint. Previously executed scenarios will populate here once saved."
            error={historyError}
            onRetry={fetchHistory}
          />
        )}

        {/* History Records Content */}
        {historyLoading ? (
          <LoadingSpinner message="Querying persisted scenario history..." />
        ) : historyList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No saved scenarios found for {selectedBuildingMeta.name} in {resourceType}. Run a simulation above to record a scenario.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 w-8">Compare</th>
                  <th className="pb-2">Scenario ID</th>
                  <th className="pb-2">Facility</th>
                  <th className="pb-2">Intervention</th>
                  <th className="pb-2">Baseline</th>
                  <th className="pb-2">Projected</th>
                  <th className="pb-2">Est. Savings</th>
                  <th className="pb-2">Created At</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {historyList.map((item) => {
                  const isChecked = selectedForComparison.includes(item.scenario_id);
                  return (
                    <tr key={item.scenario_id} className="hover:bg-slate-900/40">
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleComparisonSelection(item.scenario_id)}
                          className="accent-cyan-500 cursor-pointer"
                          title="Select to compare up to 2 scenarios"
                        />
                      </td>
                      <td className="py-2.5 font-bold text-cyan-400">{item.scenario_id}</td>
                      <td className="py-2.5 text-slate-200">{item.building_id}</td>
                      <td className="py-2.5 capitalize">{item.intervention.replace(/_/g, ' ')}</td>
                      <td className="py-2.5">
                        {item.baseline_value.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 font-bold text-cyan-300">
                        {item.projected_value.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">
                        {item.absolute_savings.toLocaleString()} {item.unit} (
                        {item.baseline_value > 0 ? `-${item.percentage_reduction.toFixed(1)}%` : 'N/A'})
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleLoadScenario(item.scenario_id)}
                          disabled={loadingHistoryItem === item.scenario_id}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-sans transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          {loadingHistoryItem === item.scenario_id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          Load
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
