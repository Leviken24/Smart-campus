import { request } from './client';
import { ObservationItem, AnalyzeImageResponse, UpdateObservationPayload } from '@/types/observation';

export interface GetObservationsFilters {
  building_id?: string;
  status?: string;
  source?: string;
}

export const observationApi = {
  analyzeImage: async (file: File, buildingId?: string): Promise<AnalyzeImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (buildingId) {
      formData.append('building_id', buildingId);
    }
    return request<AnalyzeImageResponse>('/observations/analyze-image', {
      method: 'POST',
      body: formData,
    });
  },

  getObservations: async (filters: GetObservationsFilters = {}): Promise<ObservationItem[]> => {
    const params = new URLSearchParams();
    if (filters.building_id) params.append('building_id', filters.building_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.source) params.append('source', filters.source);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<ObservationItem[]>(`/observations${query}`);
  },

  updateObservation: async (
    observationId: string,
    payload: UpdateObservationPayload
  ): Promise<ObservationItem> => {
    return request<ObservationItem>(`/observations/${encodeURIComponent(observationId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
