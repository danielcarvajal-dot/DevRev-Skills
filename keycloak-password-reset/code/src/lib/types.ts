export type RecoveryAction = 'reset' | 'unlock' | 'check';

export type KeycloakConfig = {
  url: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  emailActionClientId?: string;
  redirectUri?: string;
};

export type KeycloakUser = {
  id: string;
  username?: string;
  email?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
};

export type BruteForceStatus = {
  numFailures?: number;
  disabled?: boolean;
  lastIPFailure?: string;
  lastFailure?: number;
};

export type AccountStatus = {
  user: KeycloakUser;
  lockout: BruteForceStatus;
};

export type RecoveryResult = {
  action: RecoveryAction;
  email: string;
  user: KeycloakUser;
  lockout: BruteForceStatus;
  wasLocked: boolean;
  wasDisabled: boolean;
  unlocked: boolean;
  enabled: boolean;
  resetEmailSent: boolean;
  temporaryPassword?: string;
  resetEmailError?: string;
};

export type HttpResponse<T = unknown> = {
  data: T;
  status: number;
};

export type HttpRequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
};

export type HttpClient = {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
};

export class KeycloakError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'KeycloakError';
    this.status = status;
    this.details = details;
  }
}
