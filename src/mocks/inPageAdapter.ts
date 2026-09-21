import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getResponse, type RequestHandler } from 'msw';

function toUrl(config: InternalAxiosRequestConfig): string {
  const base = config.baseURL ?? '';
  const url = new URL(`${base}${config.url ?? ''}`, window.location.origin);
  for (const [key, value] of Object.entries((config.params ?? {}) as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Fallback for browsers that refuse to register the service worker (some private modes and embedded
 * webviews): the same MSW handlers answer the requests in the page, through an axios adapter.
 */
export function createInPageAdapter(handlers: RequestHandler[]): AxiosAdapter {
  return async (config) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(AxiosHeaders.from(config.headers).toJSON())) {
      if (value != null) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = (config.method ?? 'get').toUpperCase();
    const request = new Request(toUrl(config), {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' || config.data == null ? undefined : (config.data as BodyInit),
    });
    const response = await getResponse(handlers, request);
    if (!response) throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);

    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : '';
    } catch {
      // Not JSON: keep the text.
    }
    const result: AxiosResponse = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request,
    };
    if (response.status >= 400) {
      const code = response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
      throw new AxiosError(`Request failed with status code ${response.status}`, code, config, request, result);
    }
    return result;
  };
}
