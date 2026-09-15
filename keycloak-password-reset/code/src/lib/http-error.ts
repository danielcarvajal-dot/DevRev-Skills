import { KeycloakError } from './types';

type AxiosLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
};

export function wrapHttpError(error: unknown, fallback: string): KeycloakError {
  const err = error as AxiosLikeError;
  const status = err.response?.status;
  const data = err.response?.data;
  const hint = hintForStatus(status);
  const serverMessage = extractServerMessage(data);
  const message = [fallback, hint, serverMessage].filter(Boolean).join(' ');
  return new KeycloakError(message, status, data);
}

function hintForStatus(status?: number): string {
  switch (status) {
    case 401:
      return 'Keycloak rejected the client credentials.';
    case 403:
      return 'The client is missing realm-management roles such as manage-users and view-users.';
    case 404:
      return 'Keycloak returned 404 — check the realm name and that the user still exists.';
    default:
      return '';
  }
}

function extractServerMessage(data: unknown): string {
  if (!data) {
    return '';
  }
  if (typeof data === 'string') {
    return data.slice(0, 300);
  }
  if (typeof data === 'object') {
    const obj = data as { error?: string; error_description?: string; errorMessage?: string; message?: string };
    return obj.error_description || obj.errorMessage || obj.message || obj.error || '';
  }
  return '';
}
