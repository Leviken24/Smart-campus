import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  Building,
  Calendar,
  Sparkles,
  CheckCircle,
  FileCheck,
  Inbox,
  Users,
  Layers,
} from 'lucide-react';
import { aiApi } from '@/services/api/aiApi';
import { ReportResponse } from '@/types/ai';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

const SCOPES = [
  { id: 'campus_wide', label: 'Campus-Wide (All 3 Facilities)', type: 'Consolidated Audit' },
  { id: 'LIB', label: 'Library (LIB)', type: 'Academic & Study Facility' },
  { id: 'ACADEMIC', label: 'Academic Block (ACADEMIC)', type: 'Classrooms & Research Labs' },
  { id: 'RESIDENCE', label: 'Student Residence (RESIDENCE)', type: 'Housing & Dining Wing' },
];

const TIME_PERIODS = [
  { id: '24_hours', label: 'Last 24 Hours', description: 'Immediate operational snapshot' },
  { id: '7_days', label: 'Last 7 Days', description: 'Weekly operational trend' },
  { id: '30_days', label: 'Last 30 Days (Standard Audit)', description: 'Monthly baseline & intervention audit' },
];

const TARGET_AUDIENCES = [
  'Campus Sustainability Committee',
  'Facilities Operations & Maintenance',
  'Campus Executive Leadership',
  'Environmental Compliance Board',
];

export const Reports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const buildingParam = searchParams.get('building');
  const scenarioParam = searchParams.get('scenario');

  const initialScope = SCOPES.some((s) => s.id === buildingParam) ? (buildingParam as string) : 'campus_wide';
  const [scope, setScope] = useState<string>(initialScope);
  const [timePeriod, setTimePeriod] = useState<string>('30_days');
  const [targetAudience, setTargetAudience] = useState<string>(TARGET_AUDIENCES[0]);
  const [includedScenarios, setIncludedScenarios] = useState<string[]>(
    scenarioParam ? [scenarioParam] : ['scen-501']
  );

  useEffect(() => {
    if (buildingParam && SCOPES.some((s) => s.id === buildingParam)) {
      setScope(buildingParam);
    }
    if (scenarioParam && !includedScenarios.includes(scenarioParam)) {
      setIncludedScenarios((prev) => [...prev, scenarioParam]);
    }
  }, [buildingParam, scenarioParam]);

  const [generating, setGenerating] = useState<boolean>(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [reportError, setReportError] = useState<ApiError | Error | null>(null);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setReportError(null);
      const res = await aiApi.generateReport({
        scope,
        time_period: timePeriod,
        include_scenarios: includedScenarios,
        target_audience: targetAudience,
      });
      setReport(res);
    } catch (err: unknown) {
      setReport(null);
      if (err instanceof Error) {
        setReportError(err);
      } else {
        setReportError(new Error('Failed to generate report from backend service.'));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecotwin-sustainability-report-${report.report_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden in Print View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Executive Sustainability Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized audit documents combining telemetry, visual evidence, simulation models, and Grok strategy.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950/50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Backend Dependency Banner */}
      {reportError && (
        <DependencyNotice
          endpoint="/api/ai/reports"
          method="POST"
          owner="Person 3 (Report Generation Service) & Backend Lead"
          description="Awaiting backend report assembly pipeline. In accordance with project rules, report synthesis occurs exclusively on the backend to verify evidence grounding."
          error={reportError}
          onRetry={handleGenerateReport}
        />
      )}

      {/* Report Configuration Controls (Hidden in Print View) */}
      <div className="glass-panel p-5 print:hidden space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Audit Parameters & Synthesis Scope
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Endpoint: POST /api/ai/reports
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Facility Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" /> Facility Scope:
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {SCOPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Audit Time Window:
            </label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {TIME_PERIODS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Target Audience:
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {TARGET_AUDIENCES.map((aud, idx) => (
                <option key={idx} value={aud}>
                  {aud}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button & Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs text-slate-300 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includedScenarios.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setIncludedScenarios(scenarioParam ? [scenarioParam] : ['scen-501']);
                  } else {
                    setIncludedScenarios([]);
                  }
                }}
                className="rounded accent-cyan-500"
              />
              <span className="text-[11px]">Include Simulations in Synthesis</span>
            </label>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Compiling on Backend...' : 'Synthesize Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Document View or Empty State */}
      {generating ? (
        <div className="glass-panel p-16 text-center space-y-3">
          <LoadingSpinner message="Assembling campus telemetry and compiling executive audit narrative..." />
          <p className="text-xs text-slate-500">
            Factual evidence is being bundled from database records and analyzed by the backend reporting engine.
          </p>
        </div>
      ) : report ? (
        <div className="glass-panel p-8 sm:p-10 border-slate-800 bg-slate-950/90 text-slate-100 space-y-8 font-sans print:bg-white print:text-black print:p-0 print:border-none print:shadow-none shadow-2xl">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                ECOTWIN IMPACT ENGINE AUDIT REPORT
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 mt-1">
                {report.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono flex-wrap">
                <span>Report ID: <strong className="text-slate-200">{report.report_id}</strong></span>
                <span>&bull;</span>
                <span>Scope: <strong className="text-slate-200">{report.scope}</strong></span>
                <span>&bull;</span>
                <span>Period: <strong className="text-slate-200">{report.period}</strong></span>
                <span>&bull;</span>
                <span>Audience: <strong className="text-slate-200">{targetAudience}</strong></span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              <p>Generated: {new Date(report.generated_at).toLocaleString()}</p>
              <p className="text-cyan-400 font-bold">DSU Smart Campus Initiative</p>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                1. Executive Summary & Synthesis
              </h2>
              <ProvenanceBadge type="AI_GENERATED" size="sm" />
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {report.executive_summary}
            </p>
          </div>

          {/* Section 2: Resource Consumption Audit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                2. Baseline Resource Audit
              </h2>
              <ProvenanceBadge type="SIMULATED" size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Electrical Energy</span>
                <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {report.resource_metrics.measured_or_simulated_energy_kwh.toLocaleString()} kWh
                </p>
                <span className="text-[10px] text-slate-400">Cumulative consumption</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Water Volume</span>
                <p className="text-lg font-bold font-mono text-sky-400 mt-0.5">
                  {report.resource_metrics.water_litres.toLocaleString()} Litres
                </p>
                <span className="text-[10px] text-slate-400">Cumulative liquid volume</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Total Waste Mass</span>
                <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {report.resource_metrics.waste_kg.toLocaleString()} kg
                </p>
                <span className="text-[10px] text-slate-400">Receptacle fill tracking</span>
              </div>
            </div>
          </div>

          {/* Section 3: Anomaly & Visual Observations Audit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                3. Anomalies & Visual Observations Audit
              </h2>
              <ProvenanceBadge type="OBSERVED" size="sm" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Total Detected</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">
                  {report.observations_audit.total_detected}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-emerald-800/50">
                <span className="text-[10px] text-emerald-400 font-mono uppercase">Confirmed</span>
                <p className="text-lg font-bold text-emerald-300 mt-0.5">
                  {report.observations_audit.confirmed_count}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-amber-800/50">
                <span className="text-[10px] text-amber-400 font-mono uppercase">Requires Review</span>
                <p className="text-lg font-bold text-amber-300 mt-0.5">
                  {report.observations_audit.under_review_count}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-cyan-800/50">
                <span className="text-[10px] text-cyan-400 font-mono uppercase">Resolved</span>
                <p className="text-lg font-bold text-cyan-300 mt-0.5">
                  {report.observations_audit.resolved_count}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Tested What-If Simulations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                4. Tested What-If Simulations (Sustainability Time Machine)
              </h2>
              <ProvenanceBadge type="PROJECTED" size="sm" />
            </div>

            {report.simulated_interventions_summary.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg">
                No simulated interventions included in this report scope.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="pb-2">Scenario ID</th>
                      <th className="pb-2">Facility</th>
                      <th className="pb-2">Projected Energy Saved</th>
                      <th className="pb-2">Projected Cost Avoided</th>
                      <th className="pb-2 text-right">Calculation Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {report.simulated_interventions_summary.map((sim) => (
                      <tr key={sim.scenario_id}>
                        <td className="py-2.5 font-bold text-cyan-400">{sim.scenario_id}</td>
                        <td className="py-2.5">{sim.building_id}</td>
                        <td className="py-2.5 font-bold text-slate-100">
                          {sim.projected_energy_savings_kwh?.toLocaleString()} kWh
                        </td>
                        <td className="py-2.5 text-emerald-400 font-bold">
                          {sim.projected_cost_savings !== undefined
                            ? `$${sim.projected_cost_savings.toFixed(2)}`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          deterministic_formula_v1
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Strategic Action Plan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                5. Strategic Prioritized Action Plan
              </h2>
              <ProvenanceBadge type="AI_GENERATED" size="sm" />
            </div>

            <div className="space-y-2">
              {report.strategic_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200">{rec.action}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      Feasibility: {rec.feasibility}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        rec.priority === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : rec.priority === 'medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Governance & Provenance Statement */}
          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Data Governance & Provenance Statement
            </p>
            <p>{report.provenance_disclaimer}</p>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 text-center space-y-3">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-300">
              No Report Synthesized Yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Select your facility scope and audit time window above, then click &quot;Synthesize Report&quot;. The backend will assemble verified telemetry, observations, and completed simulations into an executive document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
