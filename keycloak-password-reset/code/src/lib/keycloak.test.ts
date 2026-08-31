import { KeycloakClient } from './keycloak';
import { HttpClient, KeycloakConfig } from './types';

function createHttp(): jest.Mocked<HttpClient> {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
}

const config: KeycloakConfig = {
  url: 'http://localhost:8080/',
  realm: 'account-unlock',
  clientId: 'unlock-agent',
  clientSecret: 'unlock-agent-demo-secret',
};

const demoUser = {
  id: 'user-1',
  username: 'demo.user',
  email: 'demo.user@example.com',
  enabled: false,
  firstName: 'Demo',
  lastName: 'User',
};

describe('KeycloakClient', () => {
  it('follows the Postman collection: token, find, lockout, unlock, enable, reset email', async () => {
    const http = createHttp();
    http.post.mockResolvedValue({ status: 200, data: { access_token: 'token-1', expires_in: 300 } });
    http.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/users')) {
        return { status: 200, data: [demoUser] };
      }
      if (url.includes('/attack-detection/brute-force/users/')) {
        return { status: 200, data: { disabled: true, numFailures: 5 } };
      }
      if (url.endsWith('/users/user-1')) {
        return { status: 200, data: demoUser };
      }
      throw new Error(`unexpected GET ${url}`);
    });
    http.delete.mockResolvedValue({ status: 204, data: '' });
    http.put.mockResolvedValue({ status: 204, data: '' });

    const client = new KeycloakClient(config, http);
    const result = await client.recoverAccount('demo.user@example.com', {
      action: 'reset',
      sendResetEmail: true,
    });

    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:8080/realms/account-unlock/protocol/openid-connect/token',
      expect.stringContaining('grant_type=client_credentials'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/users',
      expect.objectContaining({
        params: { email: 'demo.user@example.com', exact: true },
      })
    );
    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/attack-detection/brute-force/users/user-1',
      expect.any(Object)
    );
    expect(http.delete).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/attack-detection/brute-force/users/user-1',
      expect.any(Object)
    );
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/users/user-1',
      expect.objectContaining({ id: 'user-1', enabled: true }),
      expect.any(Object)
    );
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/users/user-1/execute-actions-email',
      ['UPDATE_PASSWORD'],
      expect.any(Object)
    );

    expect(result.wasLocked).toBe(true);
    expect(result.wasDisabled).toBe(true);
    expect(result.unlocked).toBe(true);
    expect(result.enabled).toBe(true);
    expect(result.resetEmailSent).toBe(true);
    expect(result.temporaryPassword).toBeUndefined();
  });

  it('sets a temporary password instead of sending email', async () => {
    const http = createHttp();
    http.post.mockResolvedValue({ status: 200, data: { access_token: 'token-1', expires_in: 300 } });
    http.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/users')) {
        return { status: 200, data: [{ ...demoUser, enabled: true }] };
      }
      return { status: 200, data: { disabled: false, numFailures: 0 } };
    });
    http.put.mockResolvedValue({ status: 204, data: '' });

    const client = new KeycloakClient(config, http);
    const result = await client.recoverAccount('demo.user@example.com', {
      action: 'reset',
      setTempPassword: true,
    });

    expect(result.temporaryPassword).toEqual(expect.stringMatching(/.{12,}/));
    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:8080/admin/realms/account-unlock/users/user-1/reset-password',
      expect.objectContaining({ type: 'password', temporary: true, value: result.temporaryPassword }),
      expect.any(Object)
    );
    expect(result.resetEmailSent).toBe(false);
  });

  it('throws a not-found error when the user is missing', async () => {
    const http = createHttp();
    http.post.mockResolvedValue({ status: 200, data: { access_token: 'token-1', expires_in: 300 } });
    http.get.mockResolvedValue({ status: 200, data: [] });

    const client = new KeycloakClient(config, http);
    await expect(client.getAccountStatus('missing@example.com')).rejects.toThrow(/No Keycloak user found/);
  });

  it('records a reset-email failure without failing the unlock', async () => {
    const http = createHttp();
    http.post.mockResolvedValue({ status: 200, data: { access_token: 'token-1', expires_in: 300 } });
    http.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/users')) {
        return { status: 200, data: [{ ...demoUser, enabled: true }] };
      }
      return { status: 200, data: { disabled: true, numFailures: 3 } };
    });
    http.delete.mockResolvedValue({ status: 204, data: '' });
    http.put.mockRejectedValue({
      response: { status: 500, data: { errorMessage: 'smtp not configured' } },
    });

    const client = new KeycloakClient(config, http);
    const result = await client.recoverAccount('demo.user@example.com', {
      action: 'reset',
      sendResetEmail: true,
    });

    expect(result.unlocked).toBe(true);
    expect(result.resetEmailSent).toBe(false);
    expect(result.resetEmailError).toMatch(/smtp not configured/);
  });
});
