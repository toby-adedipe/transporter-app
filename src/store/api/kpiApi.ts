import { baseApi } from '@/store/api/baseApi';
import type { AppResponse, RankingComparisonRequest } from '@/types/api';

interface KpiRankingsParams {
  transporterNumber: string;
  startDate: string;
  endDate: string;
  region?: string;
  kpiTypes?: string[];
}

interface KpiHistoryParams {
  transporterNumber: string;
  kpiType: string;
  startDate: string;
  endDate: string;
  region?: string;
  windowDays?: number;
}

interface KpiSummaryParams {
  transporterNumber: string;
  region?: string;
  windowDays?: number;
}

interface KpiLeaderboardParams {
  kpiType: string;
  startDate: string;
  endDate: string;
  region?: string;
  top?: number;
}

const kpiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiRankings: builder.query<AppResponse<unknown>, KpiRankingsParams>({
      query: ({ transporterNumber, startDate, endDate, region, kpiTypes }) => ({
        url: `/api/v1/kpi/rankings/${transporterNumber}`,
        params: { startDate, endDate, region, kpiTypes },
      }),
      providesTags: ['KPI'],
    }),
    getKpiHistory: builder.query<AppResponse<unknown>, KpiHistoryParams>({
      query: ({ transporterNumber, kpiType, startDate, endDate, region, windowDays }) => ({
        url: `/api/v1/kpi/rankings/${transporterNumber}/history`,
        params: { kpiType, startDate, endDate, region, windowDays },
      }),
      providesTags: ['KPI'],
    }),
    getKpiSummary: builder.query<AppResponse<unknown>, KpiSummaryParams>({
      query: ({ transporterNumber, region, windowDays }) => ({
        url: '/api/v1/kpi/rankings/summary',
        params: { transporterNumber, region, windowDays },
      }),
      providesTags: ['KPI'],
    }),
    getKpiLeaderboard: builder.query<AppResponse<unknown>, KpiLeaderboardParams>({
      query: ({ kpiType, startDate, endDate, region, top }) => ({
        url: '/api/v1/kpi/rankings/leaderboard',
        params: { kpiType, startDate, endDate, region, top },
      }),
      providesTags: ['KPI'],
    }),
    compareKpiRankings: builder.mutation<AppResponse<unknown>, RankingComparisonRequest>({
      query: (body) => ({
        url: '/api/v1/kpi/rankings/compare',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetKpiRankingsQuery,
  useGetKpiHistoryQuery,
  useGetKpiSummaryQuery,
  useGetKpiLeaderboardQuery,
  useCompareKpiRankingsMutation,
} = kpiApi;
