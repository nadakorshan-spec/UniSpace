import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'unispase_access_token';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 60000,
});

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post(
    '/api/v1/auth/refresh',
    {},
    { withCredentials: true, baseURL: '' },
  );
  const token = response.data?.data?.accessToken as string;
  if (!token) throw new Error('No access token returned');
  setAccessToken(token);
  return token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url || '';
    const isAuthCall = url.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        if (!refreshPromise) refreshPromise = refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        refreshPromise = null;
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('unispase:unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string; details?: Record<string, unknown> } } | undefined;
    if (data?.error?.details?.fieldErrors) {
      const fields = data.error.details.fieldErrors as Record<string, string[]>;
      const first = Object.values(fields)[0]?.[0];
      if (first) return first;
    }
    return data?.error?.message || error.message || 'Something went wrong';
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
