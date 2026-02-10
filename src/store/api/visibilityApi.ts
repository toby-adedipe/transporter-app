import { baseApi } from '@/store/api/baseApi';
import type { AppResponse, VisibilityFilterDto } from '@/types/api';

interface OperationalKpiVisibilityParams {
  filter: VisibilityFilterDto;
  startDate: string;
  endDate: string;
}

interface CustomerVisibilityParams {
  filter: VisibilityFilterDto;
  useNewRunRate?: boolean;
}

const visibilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTruckVisibility: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/truck-visibility/full',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getTruckVisibilityByTransporter: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/truck-visibility/transporter',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getTruckVisibilityByKm: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/truck-visibility/full-km',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getCustomerVisibility: builder.query<AppResponse<unknown>, CustomerVisibilityParams>({
      query: ({ filter, useNewRunRate }) => ({
        url: '/reports/v2/customer-visibility',
        method: 'POST',
        body: filter,
        params: useNewRunRate !== undefined ? { useNewRunRate } : undefined,
      }),
      providesTags: ['Visibility'],
    }),
    getDepotVisibility: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/depot-visibility',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getLocationVisibility: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/location-visibility',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getNoGoZoneVisibility: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/no-go-zone-visibility',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
    getOperationalKpiVisibility: builder.query<
      AppResponse<unknown>,
      OperationalKpiVisibilityParams
    >({
      query: ({ filter, startDate, endDate }) => ({
        url: '/reports/v2/operational-kpi-visibility',
        method: 'POST',
        body: filter,
        params: { startDate, endDate },
      }),
      providesTags: ['Visibility'],
    }),
    getMobilization: builder.query<AppResponse<unknown>, VisibilityFilterDto>({
      query: (body) => ({
        url: '/reports/v2/mobilization',
        method: 'POST',
        body,
      }),
      providesTags: ['Visibility'],
    }),
  }),
});

export const {
  useGetTruckVisibilityQuery,
  useGetTruckVisibilityByTransporterQuery,
  useGetTruckVisibilityByKmQuery,
  useGetCustomerVisibilityQuery,
  useGetDepotVisibilityQuery,
  useGetLocationVisibilityQuery,
  useGetNoGoZoneVisibilityQuery,
  useGetOperationalKpiVisibilityQuery,
  useGetMobilizationQuery,
} = visibilityApi;
