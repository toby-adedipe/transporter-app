import { baseApi } from '@/store/api/baseApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type {
  AppResponse,
  DemoLoginRequest,
  LoginRequest,
  LoginResponse,
  TransporterForgetPasswordRequest,
} from '@/types/api';

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AppResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/transporter/login',
        method: 'POST',
        body: credentials,
        headers: {
          'app-name': 'transporter-app',
        },
      }),
    }),
    demoLogin: builder.mutation<AppResponse<LoginResponse>, DemoLoginRequest>({
      async queryFn({ identifier, password }, _api, _extraOptions, baseQuery) {
        const normalizedIdentifier = identifier.trim();
        const payloadCandidates = normalizedIdentifier.includes('@')
          ? [
              { email: normalizedIdentifier, password },
              { emailOrTransporterNumber: normalizedIdentifier, password },
              { username: normalizedIdentifier, password },
            ]
          : [
              { transporterNumber: normalizedIdentifier, password },
              { emailOrTransporterNumber: normalizedIdentifier, password },
              { username: normalizedIdentifier, password },
              { email: normalizedIdentifier, password },
            ];

        let latestError: FetchBaseQueryError | undefined;

        for (const body of payloadCandidates) {
          const result = await baseQuery({
            url: '/auth/login/demo',
            method: 'POST',
            body,
            headers: {
              'app-name': 'transporter-app',
            },
          });

          if ('data' in result && result.data) {
            return { data: result.data as AppResponse<LoginResponse> };
          }

          if ('error' in result) {
            latestError = result.error;
          }
        }

        return {
          error:
            latestError ??
            ({
              status: 'CUSTOM_ERROR',
              error: 'Unable to login with demo endpoint.',
            } as FetchBaseQueryError),
        };
      },
    }),
    forgotPassword: builder.mutation<AppResponse<void>, TransporterForgetPasswordRequest>({
      query: (body) => ({
        url: '/auth/transporter/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    refreshToken: builder.mutation<AppResponse<{ token: string; refreshToken: string }>, string>({
      query: (refreshToken) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: refreshToken,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useDemoLoginMutation,
  useForgotPasswordMutation,
  useRefreshTokenMutation,
} = authApi;
