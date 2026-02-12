import { baseApi } from '@/store/api/baseApi';
import type { AppResponse, AssetFilterDto } from '@/types/api';

interface TruckLocationParams {
  longitude: number;
  latitude: number;
  isAfr?: boolean;
  radius?: number;
}

interface TruckQueryParams {
  registrationNumbers?: string[];
  transporterNumbers?: string[];
  truckStatuses?: string[];
  truckTypes?: string[];
  geofenceId?: number;
}

const fleetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllAssets: builder.query<AppResponse<unknown>, AssetFilterDto>({
      query: (body) => ({
        url: '/trucks/getAllAssets',
        method: 'POST',
        body,
      }),
      providesTags: ['Fleet'],
    }),
    queryTruckEntities: builder.query<AppResponse<unknown>, TruckQueryParams>({
      query: (body) => ({
        url: '/trucks/queryTruckEntities',
        method: 'POST',
        body,
      }),
      providesTags: ['Fleet'],
    }),
    getTruckLocation: builder.query<AppResponse<unknown>, TruckLocationParams>({
      query: ({ longitude, latitude, isAfr, radius }) => ({
        url: '/trucks/location',
        method: 'POST',
        body: { longitude, latitude },
        params: { isAfr, radius },
      }),
      providesTags: ['Fleet'],
    }),
  }),
});

export const { useGetAllAssetsQuery, useQueryTruckEntitiesQuery, useGetTruckLocationQuery } = fleetApi;
