import { normalizeBaseUrl, resolveConfig } from './config';

describe('normalizeBaseUrl', () => {
  it('adds a trailing slash', () => {
    expect(normalizeBaseUrl('http://localhost:8080')).toBe('http://localhost:8080/');
  });

  it('keeps an existing trailing slash', () => {
    expect(normalizeBaseUrl('http://localhost:8080/')).toBe('http://localhost:8080/');
  });
});

describe('resolveConfig', () => {
  it('reads a multi-field Keycloak connection JSON', () => {
    const config = resolveConfig({
      input_data: {
        global_values: {},
        keyrings: {
          keycloak:
            '{"url":"https://idp.example.com","realm":"account-unlock","client_id":"unlock-agent","client_secret":"s3cret"}',
        },
      },
    });

    expect(config).toEqual({
      url: 'https://idp.example.com/',
      realm: 'account-unlock',
      clientId: 'unlock-agent',
      clientSecret: 's3cret',
      emailActionClientId: undefined,
      redirectUri: undefined,
    });
  });

  it('lets organization inputs override URL and uses a raw snap-in secret', () => {
    const config = resolveConfig({
      input_data: {
        global_values: {
          keycloak_url: 'https://keycloak.internal',
          realm: 'customers',
          client_id: 'unlock-agent',
          email_action_client_id: 'web-app',
          redirect_uri: 'https://app.example.com/login',
        },
        keyrings: {
          keycloak: 'plain-secret',
        },
      },
    });

    expect(config.url).toBe('https://keycloak.internal/');
    expect(config.realm).toBe('customers');
    expect(config.clientSecret).toBe('plain-secret');
    expect(config.emailActionClientId).toBe('web-app');
    expect(config.redirectUri).toBe('https://app.example.com/login');
  });

  it('throws when the client secret is missing', () => {
    expect(() =>
      resolveConfig({
        input_data: {
          global_values: { keycloak_url: 'http://localhost:8080' },
          keyrings: {},
        },
      })
    ).toThrow(/client secret/);
  });
});
