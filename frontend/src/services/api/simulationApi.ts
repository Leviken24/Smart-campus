import { request } from './client';
import { SimulationRequest, SimulationResponse } from '@/types/simulation';

export const simulationApi = {
  runSimulation: async (payload: SimulationRequest): Promise<SimulationResponse> => {
    return request<SimulationResponse>('/simulations/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSimulation: async (scenarioId: string): Promise<SimulationResponse> => {
    return request<SimulationResponse>(`/simulations/${encodeURIComponent(scenarioId)}`);
  },

  getSimulations: async (buildingId?: string, resourceType?: string): Promise<SimulationResponse[]> => {
    const params = new URLSearchParams();
    if (buildingId) params.append('building_id', buildingId);
    if (resourceType) params.append('resource_type', resourceType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<SimulationResponse[]>(`/simulations${query}`);
  },
};
