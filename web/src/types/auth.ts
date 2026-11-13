export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer' | string;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthStatusResponse {
  isLocked: boolean;
  remainingSeconds: number;
  requireCaptcha: boolean;
  failedAttempts?: number;
}
