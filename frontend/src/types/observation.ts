export type ObservationStatus =
  | 'requires_review'
  | 'confirmed'
  | 'dismissed'
  | 'resolved';

export type ObservationSource =
  | 'image_analysis'
  | 'sensor_rule'
  | 'manual';

export type ObservationType =
  | 'waste_accumulation'
  | 'water_leakage'
  | 'energy_waste'
  | 'other';

export interface ProviderMetadata {
  provider: string;
  model: string;
  certainty_level: 'low' | 'medium' | 'high';
  detected_labels?: string[];
}

export interface ObservationItem {
  id: string;
  building_id?: string | null;
  observation_type: ObservationType | string;
  description: string;
  status: ObservationStatus;
  source: ObservationSource | string;
  image_url?: string | null;
  certainty_level?: 'low' | 'medium' | 'high';
  provider_metadata?: ProviderMetadata;
  reviewer_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface AnalyzeImageResponse {
  observation_id: string;
  building_id?: string | null;
  observation_type: string;
  description: string;
  status: ObservationStatus;
  source: string;
  image_url: string;
  provider_metadata: ProviderMetadata;
  created_at: string;
}

export interface UpdateObservationPayload {
  status: ObservationStatus;
  building_id?: string;
  reviewer_note?: string;
}
