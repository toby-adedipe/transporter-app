import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';

const LOG_CHUNK_SIZE = 1500;

const logPayloadInChunks = (prefix: string, payload: unknown) => {
  const serialized =
    typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

  if (!serialized) {
    console.log(prefix, payload);
    return;
  }

  const totalChunks = Math.ceil(serialized.length / LOG_CHUNK_SIZE);
  console.log(`${prefix} (length=${serialized.length}, chunks=${totalChunks})`);

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * LOG_CHUNK_SIZE;
    const chunk = serialized.slice(start, start + LOG_CHUNK_SIZE);
    console.log(`${prefix} [${index + 1}/${totalChunks}] ${chunk}`);
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrap to treat isSuccessful: false as an error + log all requests
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const url = typeof args === 'string' ? args : args.url;
  console.log(`[API] → ${typeof args === 'string' ? 'GET' : (args.method ?? 'GET')} ${url}`);
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error) {
    logPayloadInChunks(`[API] ✗ ${url}`, result.error);
  } else if (result.data) {
    logPayloadInChunks(`[API] ✓ ${url}`, result.data);
    const body = result.data as { isSuccessful?: boolean; message?: string };
    if (body.isSuccessful === false) {
      console.log(`[API] ✗ Business error: ${body.message}`);
      return {
        error: {
          status: 'CUSTOM_ERROR' as const,
          data: body,
          error: body.message ?? 'Request failed',
        },
      };
    }
  }
  return result;
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  // originalStatus holds the real HTTP code when RTK Query fails to parse the response body
  const httpStatus =
    typeof result.error?.status === 'number'
      ? result.error.status
      : (result.error as any)?.originalStatus ?? null;
  const is401 = httpStatus === 401;

  const shouldAttemptRefresh = (() => {
    if (!result.error || !is401) return false;
    const errorData = (result.error as any).data;
    const candidates = [
      typeof errorData?.message === 'string' ? errorData.message : '',
      typeof errorData?.detail === 'string' ? errorData.detail : '',
      typeof errorData === 'string' ? errorData : '',
      typeof (result.error as any).error === 'string' ? (result.error as any).error : '',
    ]
      .map((entry) => entry.toLowerCase())
      .filter(Boolean);

    // 401 from insights scope/claim issues should not trigger token refresh or force logout.
    const nonRefreshable401 = candidates.some(
      (entry) =>
        entry.includes('missing') && entry.includes('transporternumber') && entry.includes('claim'),
    );

    return !nonRefreshable401;
  })();

  if (result.error && is401 && shouldAttemptRefresh) {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (refreshToken) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh-token', method: 'POST', body: refreshToken },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const data = (refreshResult.data as any).result as { token: string; refreshToken: string };
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        api.dispatch({ type: 'auth/tokenRefreshed', payload: data.token });
        result = await baseQuery(args, api, extraOptions);
      } else {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Dashboard',
    'Visibility',
    'KPI',
    'Shipments',
    'EscalatedTasks',
    'Fleet',
    'Diversions',
    'Reroutings',
    'Constants',
  ],
  endpoints: () => ({}),
});
