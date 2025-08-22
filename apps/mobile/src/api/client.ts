import Constants from 'expo-constants';

const API_URLS = {
  core: Constants.expoConfig?.extra?.API_CORE_URL || 'http://localhost:8000',
  social: Constants.expoConfig?.extra?.API_SOCIAL_URL || 'http://localhost:4001',
  camera: Constants.expoConfig?.extra?.API_CAMERA_URL || 'http://localhost:4002',
};

export class ApiClient {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  setToken(token: string | null) {
    this.token = token || undefined;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${method} ${path} failed: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

// Export pre-configured clients
export const coreApi = new ApiClient(API_URLS.core);
export const socialApi = new ApiClient(API_URLS.social);
export const cameraApi = new ApiClient(API_URLS.camera);