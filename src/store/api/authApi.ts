import { baseApi } from '@/store/api/baseApi';
import type {
  AppResponse,
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

export const { useLoginMutation, useForgotPasswordMutation, useRefreshTokenMutation } = authApi;
