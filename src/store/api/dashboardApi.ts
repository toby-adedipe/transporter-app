import { baseApi } from '@/store/api/baseApi';
import type { AppResponse } from '@/types/api';

interface DashboardQueryParams {
  transporterNumber: string;
  startDate: string;
  endDate: string;
}

interface AgentMetricsParams {
  transporterNumber: string;
}

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComprehensiveDashboard: builder.query<AppResponse<unknown>, DashboardQueryParams>({
      query: ({ transporterNumber, startDate, endDate }) => ({
        url: '/api/transporter-dashboard/comprehensive',
        params: { transporterNumber, startDate, endDate },
      }),
      providesTags: ['Dashboard'],
    }),
    getOperationalDashboard: builder.query<AppResponse<unknown>, DashboardQueryParams>({
      query: ({ transporterNumber, startDate, endDate }) => ({
        url: '/api/transporter-dashboard/operational',
        params: { transporterNumber, startDate, endDate },
      }),
      providesTags: ['Dashboard'],
    }),
    getAgentMetrics: builder.query<AppResponse<unknown>, AgentMetricsParams>({
      query: ({ transporterNumber }) => ({
        url: '/api/transporter-dashboard/agent',
        params: { transporterNumber },
      }),
      providesTags: ['Dashboard'],
    }),
    getInsuranceCompliance: builder.query<AppResponse<unknown>, AgentMetricsParams>({
      query: ({ transporterNumber }) => ({
        url: '/api/transporter-dashboard/insurance-compliance',
        params: { transporterNumber },
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetComprehensiveDashboardQuery,
  useGetOperationalDashboardQuery,
  useGetAgentMetricsQuery,
  useGetInsuranceComplianceQuery,
} = dashboardApi;
