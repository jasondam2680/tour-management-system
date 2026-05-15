import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach token from localStorage
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Typed API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const api = {
  get: <T>(url: string, params?: object) =>
    apiClient.get<ApiResponse<T>>(url, { params }).then((r) => r.data.data),

  post: <T>(url: string, data?: object) =>
    apiClient.post<ApiResponse<T>>(url, data).then((r) => r.data.data),

  patch: <T>(url: string, data?: object) =>
    apiClient.patch<ApiResponse<T>>(url, data).then((r) => r.data.data),

  delete: <T>(url: string) =>
    apiClient.delete<ApiResponse<T>>(url).then((r) => r.data.data),
};
