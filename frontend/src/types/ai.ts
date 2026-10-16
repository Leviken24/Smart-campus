export interface RecommendationRequest {
  building_id?: string;
  scenario_id?: string;
  observation_ids?: string[];
  focus_area?: string;
}

export interface RecommendationResponse {
  recommendation_id: string;
  building_id?: string;
  title: string;
  summary: string;
  priority: 'low' | 'medium' | 'high';
  priority_score: number;
  priority_reasoning: string;
  suggested_actions: string[];
  referenced_data: {
    scenario_id?: string;
    projected_savings_kwh?: number;
    observation_count?: number;
    [key: string]: unknown;
  };
  provenance_label: string;
  created_at: string;
}

export interface ReportRequest {
  scope: 'campus_wide' | string;
  time_period: '24_hours' | '7_days' | '30_days' | string;
  include_scenarios?: string[];
  target_audience?: string;
}

export interface ResourceMetricsAudit {
  measured_or_simulated_energy_kwh: number;
  water_litres: number;
  waste_kg: number;
}

export interface ObservationsAudit {
  total_detected: number;
  confirmed_count: number;
  resolved_count: number;
  under_review_count: number;
}

export interface SimulatedInterventionSummary {
  scenario_id: string;
  building_id: string;
  projected_energy_savings_kwh?: number;
  projected_water_savings_litres?: number;
  projected_waste_diverted_kg?: number;
  projected_cost_savings?: number;
}

export interface StrategicRecommendationItem {
  priority: 'low' | 'medium' | 'high';
  action: string;
  feasibility: string;
}

export interface ReportResponse {
  report_id: string;
  title: string;
  scope: string;
  period: string;
  executive_summary: string;
  resource_metrics: ResourceMetricsAudit;
  observations_audit: ObservationsAudit;
  simulated_interventions_summary: SimulatedInterventionSummary[];
  strategic_recommendations: StrategicRecommendationItem[];
  provenance_disclaimer: string;
  generated_at: string;
}
