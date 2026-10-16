import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Inbox,
  Building2,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  Activity,
  FileText,
} from 'lucide-react';
import { aiApi } from '@/services/api/aiApi';
import { observationApi } from '@/services/api/observationApi';
import { RecommendationRequest, RecommendationResponse } from '@/types/ai';
import { ObservationItem } from '@/types/observation';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DependencyNotice } from '@/components/common/DependencyNotice';
import { ApiError } from '@/services/api/client';

const BUILDINGS = [
  {
    id: 'LIB',
    name: 'Library',
    type: 'Academic & Study Commons',
    operationalHours: '08:00 - 22:00 (14 hrs/day)',
  },
  {
    id: 'ACADEMIC',
    name: 'Academic Block',
    type: 'Classrooms & Research Labs',
    operationalHours: '07:30 - 20:30 (13 hrs/day)',
  },
  {
    id: 'RESIDENCE',
    name: 'Student Residence',
    type: 'Housing & Dining Wing',
    operationalHours: '24/7 Continuous Operation',
  },
];

const SAMPLE_PROMPT_CHIPS = [
  'Prioritize high-impact energy curtailment for Library',
  'Rank active waste & leak observations by urgency',
  'Evaluate weekend HVAC setback schedule for Academic Block',
  'Assess pipeline leak repair impact for Residence',
  'Formulate source waste segregation strategy',
];

export const AIAdvisor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters
  const buildingParam = searchParams.get('building');
  const scenarioParam = searchParams.get('scenario');

  const initialBuilding = BUILDINGS.some((b) => b.id === buildingParam) ? (buildingParam as string) : 'LIB';
  const initialScenario = scenarioParam || 'scen-501';

  const [selectedBuilding, setSelectedBuilding] = useState<string>(initialBuilding);
  const [linkedScenario, setLinkedScenario] = useState<string>(initialScenario);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [aiError, setAiError] = useState<ApiError | Error | null>(null);

  // Available observations for grounding
  const [availableObservations, setAvailableObservations] = useState<ObservationItem[]>([]);
  const [selectedObsIds, setSelectedObsIds] = useState<string[]>([]);

  // Filtering & Sorting State
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'date_desc'>('score_desc');

  // Sync state if URL query params change externally
  useEffect(() => {
    if (buildingParam && BUILDINGS.some((b) => b.id === buildingParam) && buildingParam !== selectedBuilding) {
      setSelectedBuilding(buildingParam);
    }
    if (scenarioParam && scenarioParam !== linkedScenario) {
      setLinkedScenario(scenarioParam);
    }
  }, [buildingParam, scenarioParam]);

  const selectedBuildingMeta = useMemo(
    () => BUILDINGS.find((b) => b.id === selectedBuilding) || BUILDINGS[0],
    [selectedBuilding]
  );

  // Load available active observations for the selected facility to support grounding
  useEffect(() => {
    const fetchBuildingObservations = async () => {
      try {
        const obs = await observationApi.getObservations({ building_id: selectedBuilding });
        setAvailableObservations(obs || []);
        // Automatically select the first observation if none selected
        if (obs && obs.length > 0) {
          setSelectedObsIds([obs[0].id]);
        } else {
          setSelectedObsIds([]);
        }
      } catch (err) {
        console.warn('Could not query facility observations for grounding:', err);
        setAvailableObservations([]);
        setSelectedObsIds([]);
      }
    };
    fetchBuildingObservations();
  }, [selectedBuilding]);

  const handleBuildingChange = (newBuilding: string) => {
    setSelectedBuilding(newBuilding);
    setSearchParams({ building: newBuilding, scenario: linkedScenario });
  };

  const handleToggleObservationSelection = (id: string) => {
    setSelectedObsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuery = async (promptText?: string) => {
    const textToSend = promptText || query;
    if (!textToSend.trim() && !promptText) return;

    try {
      setLoading(true);
      setAiError(null);

      const requestPayload: RecommendationRequest = {
        building_id: selectedBuilding,
        scenario_id: linkedScenario.trim() || undefined,
        observation_ids: selectedObsIds.length > 0 ? selectedObsIds : undefined,
        focus_area: textToSend.trim() || undefined,
      };

      const res = await aiApi.getRecommendations(requestPayload);
      setRecommendations(res || []);
    } catch (err: unknown) {
      setRecommendations([]);
      if (err instanceof Error) {
        setAiError(err);
      } else {
        setAiError(new Error('Failed to communicate with Grok AI service'));
      }
    } finally {
      setLoading(false);
      if (!promptText) {
        setQuery('');
      }
    }
  };

  // Trigger initial query or reload on mount if scenario parameter is present
  useEffect(() => {
    if (scenarioParam) {
      handleQuery(`Evaluate simulation scenario ${scenarioParam} for ${selectedBuilding}`);
    }
  }, [selectedBuilding]);

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'low':
      default:
        return 'bg-sky-950/80 text-sky-300 border-sky-800';
    }
  };

  // Filtered and Sorted Recommendations
  const filteredRecommendations = useMemo(() => {
    let list = [...recommendations];
    if (priorityFilter !== 'all') {
      list = list.filter((r) => r.priority.toLowerCase() === priorityFilter);
    }
    list.sort((a, b) => {
      if (sortBy === 'score_desc') return b.priority_score - a.priority_score;
      if (sortBy === 'score_asc') return a.priority_score - b.priority_score;
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
    return list;
  }, [recommendations, priorityFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-violet-950/80 text-violet-300 border border-violet-800/80">
              DECISION INTELLIGENCE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Grok Grounded Synthesis
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2 mt-1">
            <Sparkles className="w-6 h-6 text-violet-400" />
            AI Advisor & Recommendation Prioritization
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Synthesize verified sensor metrics, computer vision observations, and deterministic what-if simulations into prioritized operational action plans.
          </p>
        </div>

        {/* Workflow Quick Links & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/campus-twin?building=${selectedBuilding}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin</span>
          </button>

          <button
            onClick={() => navigate(`/simulations?building=${selectedBuilding}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time Machine</span>
          </button>

          <ProvenanceBadge type="AI_GENERATED" size="sm" />
        </div>
      </div>

      {/* Backend Dependency Banner for Grok Service */}
      {aiError && (
        <DependencyNotice
          endpoint="/api/ai/recommendations"
          method="POST"
          owner="Person 4 (Computer Vision / Grok / Reports Lead)"
          description="Awaiting backend Grok API integration router or valid server XAI_API_KEY. All reasoning calls route strictly through the backend to protect credentials and enforce schema validation."
          error={aiError}
          onRetry={() => handleQuery(SAMPLE_PROMPT_CHIPS[0])}
        />
      )}

      {/* Target Facility & Grounding Context Inspector */}
      <div className="glass-panel p-5 border-violet-900/60 bg-violet-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-violet-300">
              Verified Grounding Context Sent to Grok
            </h3>
          </div>
          <button
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="text-xs text-violet-400 hover:text-violet-300 font-mono transition-colors cursor-pointer"
          >
            {isContextExpanded ? 'Collapse Grounding Context' : 'Expand Grounding Context'}
          </button>
        </div>

        {/* Facility Selector Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-violet-400" />
            Target Facility:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {BUILDINGS.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBuildingChange(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedBuilding === b.id
                    ? 'bg-violet-900 text-violet-200 border border-violet-600 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {b.name} ({b.id})
              </button>
            ))}
          </div>
        </div>

        {/* Grounding Context Details */}
        {isContextExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-violet-900/40 text-xs">
            {/* Facility Profile Context */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Facility Profile</span>
              <p className="font-bold text-slate-200">{selectedBuildingMeta.name}</p>
              <p className="text-[11px] text-slate-400">{selectedBuildingMeta.operationalHours}</p>
              <p className="text-[10px] text-slate-500">{selectedBuildingMeta.type}</p>
            </div>

            {/* Linked Scenario Context */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Linked Scenario ID</span>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={linkedScenario}
                  onChange={(e) => setLinkedScenario(e.target.value)}
                  placeholder="scen-501"
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-cyan-400 font-mono w-28 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => navigate(`/simulations?building=${selectedBuilding}`)}
                  className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Configure
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Deterministic simulation link</p>
            </div>

            {/* Grounding & Evidence Integrity */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Grounding Policy</span>
              <p className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strict Factual Fidelity
              </p>
              <p className="text-[10px] text-slate-500">Zero metric hallucination guarantee</p>
            </div>
          </div>
        )}

        {/* Supporting Observations Attachment Selector */}
        {isContextExpanded && availableObservations.length > 0 && (
          <div className="pt-2 border-t border-violet-900/40 text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
              Attach Active Observations to Inquiry ({selectedObsIds.length} of {availableObservations.length} attached):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {availableObservations.map((obs) => {
                const isSelected = selectedObsIds.includes(obs.id);
                return (
                  <button
                    key={obs.id}
                    type="button"
                    onClick={() => handleToggleObservationSelection(obs.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/80 text-amber-200 border-amber-700/80'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>{obs.id} ({obs.observation_type.replace(/_/g, ' ')})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Query Bar & Quick Chips */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder={`Ask Grok about ${selectedBuildingMeta.name} sustainability interventions or simulation outcomes...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-md shadow-violet-950/50 cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synthesizing...' : 'Ask Grok'}
          </button>
        </div>

        {/* Prompt Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] text-slate-400">Sample Inquiries:</span>
          {SAMPLE_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(chip)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-violet-300 hover:border-violet-800/80 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Feed or Empty State */}
      <div className="space-y-4">
        {/* Feed Header with Filtering & Sorting Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>Grok Prioritized Recommendations ({filteredRecommendations.length})</span>
              <span className="text-xs font-mono text-slate-400">
                ({selectedBuildingMeta.name})
              </span>
            </h3>
          </div>

          {/* Filter & Sort Controls */}
          {recommendations.length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Priority Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-[11px]">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                  className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                >
                  <option value="all">All Tiers</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'score_desc' | 'score_asc' | 'date_desc')}
                  className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                >
                  <option value="score_desc">Score (10 → 0)</option>
                  <option value="score_asc">Score (0 → 10)</option>
                  <option value="date_desc">Most Recent</option>
                </select>
              </div>

              <button
                onClick={() => handleQuery(SAMPLE_PROMPT_CHIPS[0])}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="glass-panel p-12 text-center">
            <LoadingSpinner message="Grok is reasoning over verified campus context..." />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="glass-panel p-12 text-center space-y-3">
            <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-300">
                No Grounded Recommendations Generated Yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Enter an inquiry above or select a sample prompt chip. Grok will analyze the verified campus context and return prioritized actions with documented score rationale.
              </p>
            </div>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-xs italic">
            No recommendations match the current priority filter. Change or reset the priority filter above.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => {
              const targetBId = rec.building_id || selectedBuilding;
              const hasScenarioLink = Boolean(rec.referenced_data?.scenario_id);
              const hasObsLink = Boolean(rec.referenced_data?.observation_count);

              return (
                <div
                  key={rec.recommendation_id}
                  className="glass-panel p-6 border-slate-800/80 space-y-4 relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-violet-950/80 border border-violet-800/60 text-violet-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-100">{rec.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                          <span>ID: {rec.recommendation_id}</span>
                          <span>&bull;</span>
                          <button
                            onClick={() => navigate(`/campus-twin?building=${targetBId}`)}
                            className="text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Facility: {targetBId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${getPriorityStyle(
                          rec.priority
                        )}`}
                      >
                        Priority: {rec.priority}
                      </span>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                        Score: {rec.priority_score.toFixed(1)}/10
                      </span>
                      <ProvenanceBadge type="AI_GENERATED" size="sm" />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                    {rec.summary}
                  </p>

                  {/* Priority Reasoning & Rationale */}
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Priority Rationale & Ranking Factor
                    </span>
                    <p className="text-slate-300">{rec.priority_reasoning}</p>
                  </div>

                  {/* Grounded Evidence Citations Panel */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        Grounded Evidence Citations
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Provenance: {rec.provenance_label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                      {/* Linked Simulation Scenario */}
                      {hasScenarioLink ? (
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-800/40 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Scenario Citation</span>
                            <span className="text-cyan-300 font-bold">
                              {String(rec.referenced_data.scenario_id)}
                            </span>
                            {rec.referenced_data.projected_savings_kwh !== undefined && (
                              <span className="text-[11px] text-emerald-400 block font-normal">
                                {Number(rec.referenced_data.projected_savings_kwh).toLocaleString()} kWh projected reduction
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              navigate(
                                `/simulations?scenario=${rec.referenced_data.scenario_id}&building=${targetBId}`
                              )
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-sans flex items-center gap-1 transition-colors cursor-pointer"
                            title="Inspect in Sustainability Time Machine"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-500 italic">
                          No specific simulation scenario cited.
                        </div>
                      )}

                      {/* Linked Observations */}
                      {hasObsLink ? (
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-800/40 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Observation Evidence</span>
                            <span className="text-amber-300 font-bold">
                              {String(rec.referenced_data.observation_count)} active incident(s)
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/vision-inspector?building=${targetBId}`)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-sans flex items-center gap-1 transition-colors cursor-pointer"
                            title="View in Vision Inspector"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-500 italic">
                          No specific observation incident cited.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actionable Steps */}
                  {rec.suggested_actions && rec.suggested_actions.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-300 uppercase font-mono mb-2">
                        Operational Implementation Steps:
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {rec.suggested_actions.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Workflow Action Bridge Footer */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500">
                      Navigate to connected modules for verification:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/campus-twin?building=${targetBId}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Building2 className="w-3 h-3 text-cyan-400" />
                        <span>Digital Twin</span>
                      </button>

                      <button
                        onClick={() => navigate(`/monitoring?building=${targetBId}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>Telemetry</span>
                      </button>

                      <button
                        onClick={() =>
                          navigate(
                            `/reports?scenario=${rec.referenced_data?.scenario_id || ''}&building=${targetBId}`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-violet-950/80 hover:bg-violet-900/80 text-violet-300 text-xs font-medium border border-violet-800/60 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-violet-400" />
                        <span>Include in Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Transparency & Guardrail Disclaimer */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <span className="text-slate-200 font-semibold">Strict AI Grounding Guarantee:</span>{' '}
          All recommendations are synthesized by the Grok API based strictly on verified campus telemetry, computer vision observations, and deterministic simulation outputs. The AI never invents unmeasured sensor numbers or calculates authoritative engineering figures.
        </p>
      </div>
    </div>
  );
};
