export interface BackendErrorEnvelope {
  error: {
    code: string | number;
    message: string;
    error_type: string;
    details?: Record<string, unknown> | Array<unknown>;
    timestamp: string;
  };
}

export class ApiError extends Error {
  status: number;
  errorType: string;
  details?: Record<string, unknown> | Array<unknown>;
  timestamp: string;

  constructor(status: number, message: string, errorType = 'ApiError', details?: Record<string, unknown> | Array<unknown>, timestamp?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorType = errorType;
    this.details = details;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api';
const DEFAULT_TIMEOUT_MS = 15000;

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanBase = BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorType = 'HttpError';
      let details: Record<string, unknown> | Array<unknown> | undefined = undefined;
      let timestamp = new Date().toISOString();

      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          const env = errorData as BackendErrorEnvelope;
          errorMessage = env.error.message || errorMessage;
          errorType = env.error.error_type || errorType;
          details = env.error.details;
          timestamp = env.error.timestamp || timestamp;
        } else if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          // FastAPI standard detail
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          errorType = 'FastApiValidationError';
          details = errorData;
        }
      } catch {
        // Response was not JSON, use raw statusText
      }

      throw new ApiError(response.status, errorMessage, errorType, details, timestamp);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out after 15 seconds. Please try again.', 'TimeoutError');
    }
    const message = err instanceof Error ? err.message : 'Unknown network error';
    throw new ApiError(0, `Network error: ${message}`, 'NetworkError');
  }
}
