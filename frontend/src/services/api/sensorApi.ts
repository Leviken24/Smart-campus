import { request } from './client';
import { SensorReading } from '@/types/campus';

export interface GetReadingsResponse {
  building_id: string;
  metric_filtered?: string;
  readings_count: number;
  readings: SensorReading[];
}

export interface SimulateReadingsRequest {
  building_ids?: string[];
  metrics?: string[];
  points_per_metric?: number;
}

export interface SimulateReadingsResponse {
  generated_count: number;
  status: string;
  source: string;
  message: string;
}

export const sensorApi = {
  getReadings: async (
    buildingId: string,
    metric?: string,
    limit = 50
  ): Promise<GetReadingsResponse> => {
    const params = new URLSearchParams();
    if (metric) params.append('metric', metric);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<GetReadingsResponse>(`/buildings/${encodeURIComponent(buildingId)}/readings${query}`);
  },

  postReading: async (reading: SensorReading): Promise<SensorReading & { status: string }> => {
    return request<SensorReading & { status: string }>('/sensors/readings', {
      method: 'POST',
      body: JSON.stringify(reading),
    });
  },

  simulate: async (payload: SimulateReadingsRequest = {}): Promise<SimulateReadingsResponse> => {
    return request<SimulateReadingsResponse>('/sensors/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
