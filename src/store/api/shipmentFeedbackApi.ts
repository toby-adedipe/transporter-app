import { baseApi } from '@/store/api/baseApi';
import type { AppResponse, ShipmentFeedbackSearchFilter } from '@/types/api';

const shipmentFeedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeedbackByLogon: builder.query<AppResponse<unknown>, string>({
      query: (logon) => ({
        url: `/transporter/feedback/by-logon/${encodeURIComponent(logon)}`,
      }),
      providesTags: ['Shipments'],
    }),
    searchFeedback: builder.query<AppResponse<unknown>, ShipmentFeedbackSearchFilter>({
      query: (body) => ({
        url: '/transporter/feedback/search',
        method: 'POST',
        body,
      }),
      providesTags: ['Shipments'],
    }),
    getFeedbackById: builder.query<AppResponse<unknown>, number>({
      query: (id) => ({
        url: `/transporter/feedback/${id}`,
      }),
      providesTags: ['Shipments'],
    }),
  }),
});

export const {
  useGetFeedbackByLogonQuery,
  useSearchFeedbackQuery,
  useGetFeedbackByIdQuery,
} = shipmentFeedbackApi;
