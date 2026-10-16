import { request } from './client';
import { HealthResponse } from '@/types/health';

export const healthApi = {
  checkHealth: async (): Promise<HealthResponse> => {
    return request<HealthResponse>('/health');
  },
};
