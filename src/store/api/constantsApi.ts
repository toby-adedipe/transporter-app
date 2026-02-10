import { baseApi } from '@/store/api/baseApi';
import type { AppResponse } from '@/types/api';

const constantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTruckStatuses: builder.query<AppResponse<unknown>, void>({
      query: () => '/constants/truck-statuses',
      providesTags: ['Constants'],
    }),
    getShipmentStatuses: builder.query<AppResponse<unknown>, void>({
      query: () => '/constants/shipment-statuses',
      providesTags: ['Constants'],
    }),
    getShipmentCategories: builder.query<AppResponse<unknown>, void>({
      query: () => '/constants/shipment-categories',
      providesTags: ['Constants'],
    }),
    getEscalationTypes: builder.query<AppResponse<unknown>, void>({
      query: () => '/constants/escalation-types',
      providesTags: ['Constants'],
    }),
  }),
});

export const {
  useGetTruckStatusesQuery,
  useGetShipmentStatusesQuery,
  useGetShipmentCategoriesQuery,
  useGetEscalationTypesQuery,
} = constantsApi;
