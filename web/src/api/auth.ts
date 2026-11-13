import type { AuthResponse, AuthStatusResponse, User } from '../types/auth';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:3000';

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Ensures httpOnly cookies (refresh_token) are sent and received
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.error || 'Yêu cầu không thành công');
    error.status = res.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function loginApi(credentials: { email: string; password: string; recaptchaToken?: string }): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerApi(payload: { email: string; password: string; displayName?: string; recaptchaToken?: string }): Promise<{ message: string; email: string; requiresActivation: boolean }> {
  return authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function activateApi(payload: { email: string; otp: string }): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/activate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendOtpApi(email: string): Promise<{ message: string }> {
  return authFetch('/api/auth/activate/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function refreshApi(refreshToken?: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
  });
}

export async function logoutApi(refreshToken?: string): Promise<{ message: string }> {
  return authFetch('/api/auth/logout', {
    method: 'POST',
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
  });
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  return authFetch('/api/auth/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(payload: { token: string; password: string }): Promise<{ message: string }> {
  return authFetch('/api/auth/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMeApi(accessToken: string): Promise<{ user: User }> {
  return authFetch<{ user: User }>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAuthStatusApi(email?: string): Promise<AuthStatusResponse> {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return authFetch<AuthStatusResponse>(`/api/auth/status${query}`);
}
