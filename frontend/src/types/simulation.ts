export type SimulationResource = 'energy' | 'water' | 'waste';

export interface SimulationBaseline {
  power_kw?: number;
  operating_hours_per_day?: number;
  operating_days?: number;
  baseline_energy_kwh?: number;
  leak_flow_rate_lpm?: number;
  duration_minutes?: number;
  baseline_water_litres?: number;
  baseline_waste_kg?: number;
  baseline_segregation_fraction?: number;
  [key: string]: number | undefined;
}

export interface SimulationParameters {
  proposed_hours_per_day?: number;
  electricity_tariff_per_kwh?: number;
  repaired_flow_rate_lpm?: number;
  proposed_segregation_fraction?: number;
  [key: string]: number | undefined;
}

export interface SimulationRequest {
  building_id: string;
  resource_type: SimulationResource;
  intervention: string;
  baseline: SimulationBaseline;
  parameters: SimulationParameters;
}

export interface SimulationResponse {
  scenario_id: string;
  building_id: string;
  resource_type: SimulationResource;
  intervention: string;
  baseline_value: number;
  projected_value: number;
  unit: string;
  absolute_savings: number;
  percentage_reduction: number;
  estimated_cost_savings?: number;
  currency?: string;
  assumptions: string[];
  calculation_method: string;
  provenance_label: string;
  created_at: string;
}
