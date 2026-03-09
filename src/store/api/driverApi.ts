import { baseApi } from '@/store/api/baseApi';
import type { AppResponse } from '@/types/api';

const driverApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDriverHos: builder.query<AppResponse<unknown>, number>({
      query: (driverId) => ({
        url: `/driver/${driverId}/hos`,
      }),
      providesTags: ['Shipments'],
    }),
  }),
});

export const { useGetDriverHosQuery } = driverApi;
