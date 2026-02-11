import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';

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

// Wrap to treat isSuccessful: false as an error
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.data) {
    const body = result.data as { isSuccessful?: boolean; message?: string };
    if (body.isSuccessful === false) {
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

  if (result.error && result.error.status === 401) {
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
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
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
