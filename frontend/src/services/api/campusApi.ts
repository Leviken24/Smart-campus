import { request } from './client';
import { CampusOverview, BuildingSummary, BuildingDetail } from '@/types/campus';

export const campusApi = {
  getOverview: async (): Promise<CampusOverview> => {
    return request<CampusOverview>('/campus');
  },

  getBuildings: async (): Promise<BuildingSummary[]> => {
    return request<BuildingSummary[]>('/buildings');
  },

  getBuilding: async (buildingId: string): Promise<BuildingDetail> => {
    return request<BuildingDetail>(`/buildings/${encodeURIComponent(buildingId)}`);
  },
};
