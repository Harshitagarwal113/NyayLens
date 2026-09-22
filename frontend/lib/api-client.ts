import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = { error: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    const errorMsg = typeof data.error === 'object' && data.error?.message ? data.error.message : data.error;
    throw new ApiError(response.status, errorMsg || 'An unexpected error occurred');
  }

  // Handle standard { success, data, error } backend envelope if present
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      const errorMsg = typeof data.error === 'object' && data.error?.message ? data.error.message : data.error;
      throw new ApiError(response.status, errorMsg || 'An unexpected error occurred');
    }
    return data.data as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T, D = unknown>(endpoint: string, data: D, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    
  put: <T, D = unknown>(endpoint: string, data: D, options?: RequestInit) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
