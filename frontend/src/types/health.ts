export interface ProviderStatus {
  grok_configured: boolean;
  vision_configured: boolean;
  [key: string]: boolean;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  version: string;
  timestamp: string;
  database: 'connected' | 'disconnected';
  providers: ProviderStatus;
}
