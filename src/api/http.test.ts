import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { createHttpClient, type AuthHandlers } from './http';

function respond(status: number, data: unknown): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) => {
    const response = { status, statusText: '', data, headers: {}, config };
    if (status >= 400) {
      return Promise.reject(new AxiosError('failed', 'ERR_BAD_REQUEST', config, {}, response));
    }
    return Promise.resolve(response);
  };
}

function setup(adapter: AxiosAdapter, getToken: AuthHandlers['getToken'] = () => Promise.resolve('token-123')) {
  const onUnauthorized = vi.fn();
  const client = createHttpClient('http://api.test', { getToken, onUnauthorized });
  client.defaults.adapter = adapter;
  return { client, onUnauthorized };
}

describe('createHttpClient', () => {
  it('sends a fresh bearer token with every request', async () => {
    const adapter = vi.fn(respond(200, []));
    const getToken = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('refreshed');
    const { client } = setup(adapter, getToken);

    await client.get('/employees');
    await client.get('/employees');

    const headers = adapter.mock.calls.map(([config]) => config.headers.get('Authorization'));
    expect(headers).toEqual(['Bearer first', 'Bearer refreshed']);
    expect(adapter.mock.calls[0]?.[0].baseURL).toBe('http://api.test');
  });

  it('starts a new login when the API answers 401', async () => {
    const { client, onUnauthorized } = setup(respond(401, ''));

    await expect(client.get('/employees')).rejects.toMatchObject({ kind: 'UNAUTHORIZED', status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not call the API and starts a new login when the token cannot be refreshed', async () => {
    const adapter = vi.fn(respond(200, []));
    const { client, onUnauthorized } = setup(adapter, () => Promise.reject(new Error('refresh token expired')));

    await expect(client.get('/employees')).rejects.toBeInstanceOf(ApiError);
    expect(adapter).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('rejects business errors as ApiError with the backend message, without logging out', async () => {
    const { client, onUnauthorized } = setup(
      respond(409, { code: 'CONFLICT', message: "Employee 'Jose' already exists" }),
    );

    await expect(client.post('/employees', {})).rejects.toMatchObject({
      kind: 'CONFLICT',
      message: "Employee 'Jose' already exists",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
