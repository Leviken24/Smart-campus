import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  Zap,
  Droplets,
  Trash2,
  RefreshCw,
  Table as TableIcon,
  CheckCircle,
  Inbox,
  BarChart3,
  TrendingUp,
  Download,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { sensorApi } from '@/services/api/sensorApi';
import { SensorReading } from '@/types/campus';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

const BUILDINGS = [
  { id: 'LIB', name: 'Library', type: 'Academic & Study Commons' },
  { id: 'ACADEMIC', name: 'Academic Block', type: 'Lecture Halls & Labs' },
  { id: 'RESIDENCE', name: 'Student Residence', type: 'Housing & Dining Wing' },
];

const METRIC_TABS = [
  {
    id: 'energy_consumption',
    label: 'Energy (kWh)',
    typeLabel: 'Cumulative Energy Consumption',
    resourceType: 'energy',
    icon: Zap,
    unit: 'kWh',
    color: '#06b6d4',
    clarification: 'Measured in cumulative electrical energy consumption (kWh), not instantaneous power (kW).',
  },
  {
    id: 'water_volume',
    label: 'Water Volume (L)',
    typeLabel: 'Cumulative Water Volume',
    resourceType: 'water',
    icon: Droplets,
    unit: 'L',
    color: '#38bdf8',
    clarification: 'Measured in cumulative liquid volume (Litres), not instantaneous flow rate (L/min).',
  },
  {
    id: 'waste_fill_level',
    label: 'Waste Fill (%)',
    typeLabel: 'Receptacle Fill Level',
    resourceType: 'waste',
    icon: Trash2,
    unit: '%',
    color: '#f59e0b',
    clarification: 'Measured in receptacle volume capacity percentage (0 - 100%), not continuous flow.',
  },
];

export const ResourceMonitoring: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read initial building and metric from URL parameters if present
  const buildingParam = searchParams.get('building');
  const metricParam = searchParams.get('metric');

  const initialBuilding = BUILDINGS.some((b) => b.id === buildingParam) ? (buildingParam as string) : 'LIB';
  const initialMetric = METRIC_TABS.some((m) => m.id === metricParam) ? (metricParam as string) : 'energy_consumption';

  const [selectedBuilding, setSelectedBuilding] = useState<string>(initialBuilding);
  const [selectedMetric, setSelectedMetric] = useState<string>(initialMetric);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [simulateSuccess, setSimulateSuccess] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  // Sync state if URL search parameters change externally
  useEffect(() => {
    if (buildingParam && BUILDINGS.some((b) => b.id === buildingParam) && buildingParam !== selectedBuilding) {
      setSelectedBuilding(buildingParam);
    }
    if (metricParam && METRIC_TABS.some((m) => m.id === metricParam) && metricParam !== selectedMetric) {
      setSelectedMetric(metricParam);
    }
  }, [buildingParam, metricParam]);

  const activeTabConfig = useMemo(
    () => METRIC_TABS.find((t) => t.id === selectedMetric) || METRIC_TABS[0],
    [selectedMetric]
  );

  const selectedBuildingMeta = useMemo(
    () => BUILDINGS.find((b) => b.id === selectedBuilding) || BUILDINGS[0],
    [selectedBuilding]
  );

  // Update query parameters when building or metric changes
  const handleSelectBuilding = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSearchParams({ building: buildingId, metric: selectedMetric });
  };

  const handleSelectMetric = (metricId: string) => {
    setSelectedMetric(metricId);
    setSearchParams({ building: selectedBuilding, metric: metricId });
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sensorApi.getReadings(selectedBuilding, selectedMetric);
      setReadings(res.readings || []);
    } catch (err: unknown) {
      setReadings([]);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(`Failed to query telemetry for ${selectedBuilding}`));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [selectedBuilding, selectedMetric]);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setSimulateSuccess(null);
      setSimulateError(null);
      const res = await sensorApi.simulate({
        building_ids: [selectedBuilding],
        metrics: [selectedMetric],
        points_per_metric: 12,
      });
      setSimulateSuccess(res.message || `Ingested ${res.generated_count} simulated readings.`);
      await fetchReadings();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setSimulateError('Backend simulation route (POST /api/sensors/simulate) is pending implementation by Person 2.');
      } else if (err instanceof Error) {
        setSimulateError(err.message);
      } else {
        setSimulateError('Simulation request failed.');
      }
    } finally {
      setSimulating(false);
    }
  };

  // Telemetry summary statistics
  const stats = useMemo(() => {
    if (readings.length === 0) return null;
    const values = readings.map((r) => r.value).filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const latest = readings[readings.length - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      latestValue: latest.value,
      latestUnit: latest.unit,
      latestSource: latest.source,
      average: avg.toFixed(1),
      max: max.toFixed(1),
      min: min.toFixed(1),
      count: readings.length,
    };
  }, [readings]);

  // Filtered readings for table view
  const filteredReadings = useMemo(() => {
    if (!searchTerm.trim()) return readings;
    const query = searchTerm.toLowerCase();
    return readings.filter(
      (r) =>
        r.sensor_id.toLowerCase().includes(query) ||
        r.timestamp.toLowerCase().includes(query) ||
        r.source.toLowerCase().includes(query)
    );
  }, [readings, searchTerm]);

  // CSV Export utility
  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ['Timestamp', 'Sensor ID', 'Building ID', 'Metric', 'Value', 'Unit', 'Source'];
    const rows = readings.map((r) => [
      r.timestamp,
      r.sensor_id,
      r.building_id,
      r.metric,
      r.value.toString(),
      r.unit,
      r.source,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ecotwin_${selectedBuilding}_${selectedMetric}_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Resource Telemetry Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry streams, unit verification, and synthetic sensor simulation controls.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/campus-twin?building=${selectedBuilding}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin</span>
          </button>

          <button
            onClick={() =>
              navigate(`/simulations?building=${selectedBuilding}&resource=${activeTabConfig.resourceType}`)
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Simulate Interventions</span>
          </button>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all shadow-md shadow-cyan-950/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Ingesting Stream...' : 'Simulate 24h Stream'}
          </button>
        </div>
      </div>

      {/* Backend Dependency Banner */}
      {error && (
        <DependencyNotice
          endpoint={`/api/buildings/${selectedBuilding}/readings`}
          method="GET"
          owner="Person 2 (Digital Twin & Sensor Lead)"
          description={`Awaiting historical readings endpoint. Telemetry series will render automatically once ingested.`}
          error={error}
          onRetry={fetchReadings}
        />
      )}

      {/* Simulation Feedback Banners */}
      {simulateSuccess && (
        <div className="p-3 rounded-xl border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulateSuccess}</span>
          </div>
          <button
            onClick={() => setSimulateSuccess(null)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {simulateError && (
        <div className="p-3 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{simulateError}</span>
          </div>
          <button
            onClick={() => setSimulateError(null)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls & Filter Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Building Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Facility:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {BUILDINGS.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedBuilding === b.id
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 hidden lg:inline">
            ({selectedBuildingMeta.type})
          </span>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex-wrap">
          {METRIC_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedMetric === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectMetric(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards (When Readings Exist) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Latest Reading</span>
              <ProvenanceBadge type={stats.latestSource} size="sm" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-100">
              {stats.latestValue}{' '}
              <span className="text-xs font-normal text-slate-400">{stats.latestUnit}</span>
            </div>
          </div>

          <div className="glass-panel p-3.5">
            <div className="text-slate-400 text-xs mb-1">Series Average</div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {stats.average}{' '}
              <span className="text-xs font-normal text-slate-400">{activeTabConfig.unit}</span>
            </div>
          </div>

          <div className="glass-panel p-3.5">
            <div className="text-slate-400 text-xs mb-1">Peak Observation</div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {stats.max}{' '}
              <span className="text-xs font-normal text-slate-400">{activeTabConfig.unit}</span>
            </div>
          </div>

          <div className="glass-panel p-3.5">
            <div className="text-slate-400 text-xs mb-1">Ingested Samples</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              {stats.count}{' '}
              <span className="text-xs font-normal text-slate-500">records</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Telemetry Chart Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{activeTabConfig.typeLabel} Telemetry</span>
              <span className="font-mono text-xs text-slate-400">
                ({selectedBuildingMeta.name} — {selectedBuilding})
              </span>
            </h3>
            {/* Explicit Unit & Physics Disclaimer */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{activeTabConfig.clarification}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            {readings.length > 0 && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1 ${
                    chartType === 'line' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Line chart view"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Line</span>
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1 ${
                    chartType === 'bar' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bar chart view"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Bar</span>
                </button>
              </div>
            )}

            {readings.length > 0 && readings[0].source && (
              <ProvenanceBadge type={readings[0].source} />
            )}
          </div>
        </div>

        {/* Recharts Chart View or Honest Empty State */}
        {loading ? (
          <LoadingSpinner message="Querying telemetry series..." />
        ) : readings.length === 0 ? (
          <div className="h-72 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Inbox className="w-10 h-10 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-300">
                No telemetry readings recorded
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                No sensor readings available for {activeTabConfig.label} in {selectedBuildingMeta.name}. Click &quot;Simulate 24h Stream&quot; above to ingest validated test telemetry.
              </p>
            </div>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition-colors"
            >
              Trigger Stream Ingestion
            </button>
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    unit={` ${activeTabConfig.unit}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value} ${activeTabConfig.unit}`, activeTabConfig.label]}
                    labelFormatter={(label) => `Timestamp: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={activeTabConfig.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: activeTabConfig.color }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    unit={` ${activeTabConfig.unit}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value} ${activeTabConfig.unit}`, activeTabConfig.label]}
                    labelFormatter={(label) => `Timestamp: ${label}`}
                  />
                  <Bar
                    dataKey="value"
                    fill={activeTabConfig.color}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Raw Readings Data Table */}
      <div className="glass-panel p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-cyan-400" />
              Verified Readings Register ({readings.length} records)
            </h3>
            {readings.length > 0 && readings[0].source && (
              <ProvenanceBadge type={readings[0].source} size="sm" />
            )}
          </div>

          {/* Table Search & Export Controls */}
          {readings.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search sensor or time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
              />
              <button
                onClick={handleExportCSV}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {readings.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-6">
            Awaiting sensor ingestion payload.
          </p>
        ) : filteredReadings.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">
            No readings match search query &quot;{searchTerm}&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Sensor ID</th>
                  <th className="pb-2">Building</th>
                  <th className="pb-2">Metric</th>
                  <th className="pb-2">Reading</th>
                  <th className="pb-2 text-right">Data Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredReadings.slice(-15).map((r, idx) => (
                  <tr key={r.id || `${r.sensor_id}-${r.timestamp}-${idx}`} className="hover:bg-slate-900/40">
                    <td className="py-2.5 text-slate-400">{r.timestamp}</td>
                    <td className="py-2.5 font-bold text-slate-200">{r.sensor_id}</td>
                    <td className="py-2.5 text-cyan-400">{r.building_id}</td>
                    <td className="py-2.5">{r.metric}</td>
                    <td className="py-2.5 font-bold text-slate-100">
                      {r.value} <span className="text-slate-400 font-normal">{r.unit}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <ProvenanceBadge type={r.source} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Next Step Workflow Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              Test Interventions with the Sustainability Time Machine
            </h4>
            <p className="text-[11px] text-slate-400">
              Simulate schedule cutbacks, fixture retrofits, or leak repairs based on {selectedBuildingMeta.name}&apos;s telemetry.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            navigate(`/simulations?building=${selectedBuilding}&resource=${activeTabConfig.resourceType}`)
          }
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0"
        >
          <span>Launch Simulation</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
