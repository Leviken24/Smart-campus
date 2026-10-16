export interface CampusMetrics {
  total_energy_kwh: number;
  total_water_litres: number;
  total_waste_kg: number;
  waste_segregation_rate_percent: number;
}

export interface StatusSummary {
  active_observations_count: number;
  requires_review_count: number;
  confirmed_issues_count: number;
}

export interface ProvenanceSummary {
  energy: string;
  water: string;
  waste: string;
}

export interface CampusOverview {
  campus_id: string;
  aggregation_period: string;
  metrics: CampusMetrics;
  status_summary: StatusSummary;
  provenance: ProvenanceSummary;
  last_updated: string;
}

export interface BuildingMetrics {
  energy_consumption_kwh: number;
  water_volume_litres: number;
  waste_fill_level_percent: number;
}

export interface BuildingSummary {
  id: 'ACADEMIC' | 'LIB' | 'RESIDENCE' | string;
  name: string;
  building_type: string;
  metrics: BuildingMetrics;
  aggregation_period: string;
  active_issues_count: number;
  requires_review_count: number;
  updated_at: string;
}

export interface SensorItem {
  id: string;
  metric: string;
  unit: string;
  status: 'online' | 'offline' | 'degraded';
  source: 'simulated' | 'manual' | 'real';
}

export interface BuildingDetail {
  id: string;
  name: string;
  building_type: string;
  operational_hours: string;
  baseline_metrics: {
    energy_daily_kwh: number;
    water_daily_litres: number;
    waste_daily_kg: number;
  };
  sensors: SensorItem[];
}

export interface SensorReading {
  id?: string;
  sensor_id: string;
  building_id: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  source: 'simulated' | 'manual' | 'real';
}
