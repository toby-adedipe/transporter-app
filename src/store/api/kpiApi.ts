import { baseApi } from '@/store/api/baseApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { AI_INSIGHTS_API_KEY, AI_INSIGHTS_URL } from '@/constants/config';
import type {
  AppResponse,
  KpiAiAnalysisRequest,
  KpiAiAnalysisResult,
  KpiFilterDto,
  KpiHistoryResult,
  KpiLeaderboardResult,
  KpiRankingsResult,
  KpiV2AggregatedResult,
  RankingComparisonRequest,
} from '@/types/api';

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

const AI_INSIGHTS_PATH = '/insights/transporter/mobile-analysis';

const resolveAiInsightsUrl = (): string => {
  if (!AI_INSIGHTS_URL) return '';
  if (AI_INSIGHTS_URL.includes(AI_INSIGHTS_PATH)) return AI_INSIGHTS_URL;
  return `${AI_INSIGHTS_URL.replace(/\/+$/, '')}${AI_INSIGHTS_PATH}`;
};

const kpiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpiV2Aggregated: builder.query<AppResponse<KpiV2AggregatedResult>, KpiFilterDto>({
      query: (body) => ({
        url: '/kpi/v2/metrics/aggregated',
        method: 'POST',
        body,
      }),
      providesTags: ['KPI'],
    }),
    analyzeKpiMetrics: builder.mutation<AppResponse<KpiAiAnalysisResult>, KpiAiAnalysisRequest>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        const insightsUrl = resolveAiInsightsUrl();
        if (!insightsUrl || !AI_INSIGHTS_API_KEY) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: { message: 'AI insights endpoint is not configured' },
              error: 'AI insights endpoint is not configured',
            } as FetchBaseQueryError,
          };
        }

        const result = await baseQuery({
          url: insightsUrl,
          method: 'POST',
          body,
          headers: {
            'x-api-key': AI_INSIGHTS_API_KEY,
          },
        });

        return result.error
          ? { error: result.error as FetchBaseQueryError }
          : { data: result.data as AppResponse<KpiAiAnalysisResult> };
      },
    }),
    getKpiRankings: builder.query<AppResponse<KpiRankingsResult>, KpiRankingsParams>({
      query: ({ transporterNumber, startDate, endDate, region, kpiTypes }) => ({
        url: `/api/v1/kpi/rankings/${transporterNumber}`,
        params: { startDate, endDate, region, kpiTypes },
      }),
      providesTags: ['KPI'],
    }),
    getKpiHistory: builder.query<AppResponse<KpiHistoryResult>, KpiHistoryParams>({
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
    getKpiLeaderboard: builder.query<AppResponse<KpiLeaderboardResult>, KpiLeaderboardParams>({
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
  useGetKpiV2AggregatedQuery,
  useAnalyzeKpiMetricsMutation,
  useGetKpiRankingsQuery,
  useGetKpiHistoryQuery,
  useGetKpiSummaryQuery,
  useGetKpiLeaderboardQuery,
  useCompareKpiRankingsMutation,
} = kpiApi;
