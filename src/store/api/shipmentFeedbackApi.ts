import { baseApi } from '@/store/api/baseApi';
import type {
  AppResponse,
  ShipmentFeedbackCreateRequest,
  ShipmentFeedbackEligibilityRequest,
  ShipmentFeedbackSearchFilter,
} from '@/types/api';

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
    precheckFeedbackEligibility: builder.query<
      AppResponse<unknown>,
      ShipmentFeedbackEligibilityRequest
    >({
      query: (body) => ({
        url: '/transporter/feedback/eligibility-check',
        method: 'POST',
        body,
      }),
      providesTags: ['Shipments'],
    }),
    createFeedback: builder.mutation<AppResponse<unknown>, ShipmentFeedbackCreateRequest>({
      query: (body) => ({
        url: '/transporter/feedback',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shipments'],
    }),
  }),
});

export const {
  useGetFeedbackByLogonQuery,
  useSearchFeedbackQuery,
  useGetFeedbackByIdQuery,
  usePrecheckFeedbackEligibilityQuery,
  useLazyPrecheckFeedbackEligibilityQuery,
  useCreateFeedbackMutation,
} = shipmentFeedbackApi;
