import { baseApi } from '@/store/api/baseApi';
import type {
  AppResponse,
  EscalatedTaskFilterDto,
  OrderDiversionFilterDto,
  OrderReroutingFilterDto,
} from '@/types/api';

interface AllShipmentsParams {
  startDate: string;
  endDate: string;
  region?: string;
  status?: string;
  transporterSapId?: string;
  page?: number;
  limit?: number;
}

interface TodayShipmentsParams {
  region?: string;
  status?: string;
  limit?: number;
  page?: number;
}

const shipmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllShipments: builder.query<AppResponse<unknown>, AllShipmentsParams>({
      query: ({ startDate, endDate, region, status, transporterSapId, page, limit }) => ({
        url: '/shipment/all',
        params: { startDate, endDate, region, status, transporterSapId, page, limit },
      }),
      providesTags: ['Shipments'],
    }),
    getTodayShipments: builder.query<AppResponse<unknown>, TodayShipmentsParams>({
      query: ({ region, status, limit, page }) => ({
        url: '/shipment/all/today',
        params: { region, status, limit, page },
      }),
      providesTags: ['Shipments'],
    }),
    getEscalatedTasks: builder.query<AppResponse<unknown>, EscalatedTaskFilterDto>({
      query: (body) => ({
        url: '/task/escalated/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['EscalatedTasks'],
    }),
    getDiversions: builder.query<AppResponse<unknown>, OrderDiversionFilterDto>({
      query: (body) => ({
        url: '/diversions/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['Diversions'],
    }),
    getReroutings: builder.query<AppResponse<unknown>, OrderReroutingFilterDto>({
      query: (body) => ({
        url: '/reroutings/filter',
        method: 'POST',
        body,
      }),
      providesTags: ['Reroutings'],
    }),
  }),
});

export const {
  useGetAllShipmentsQuery,
  useGetTodayShipmentsQuery,
  useGetEscalatedTasksQuery,
  useGetDiversionsQuery,
  useGetReroutingsQuery,
} = shipmentsApi;
