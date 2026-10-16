import { request } from './client';
import { RecommendationRequest, RecommendationResponse, ReportRequest, ReportResponse } from '@/types/ai';

export const aiApi = {
  getRecommendations: async (payload: RecommendationRequest): Promise<RecommendationResponse[]> => {
    const res = await request<RecommendationResponse[] | RecommendationResponse>('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return Array.isArray(res) ? res : [res];
  },

  generateReport: async (payload: ReportRequest): Promise<ReportResponse> => {
    return request<ReportResponse>('/ai/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
