import { baseApi } from '@/store/api/baseApi';
import type {
  AppResponse,
  ShipmentFeedbackCreateRequest,
  ShipmentFeedbackEligibilityRequest,
  ShipmentFeedbackSearchFilter,
} from '@/types/api';

const LOG_CHUNK_SIZE = 1500;

const logFeedbackResponse = <T>(endpointName: string, response: T): T => {
  const serialized = JSON.stringify(response, null, 2);

  if (!serialized) {
    console.log(`[Feedback API] ✓ ${endpointName}`, response);
    return response;
  }

  const totalChunks = Math.ceil(serialized.length / LOG_CHUNK_SIZE);
  console.log(
    `[Feedback API] ✓ ${endpointName} (length=${serialized.length}, chunks=${totalChunks})`,
  );

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * LOG_CHUNK_SIZE;
    const chunk = serialized.slice(start, start + LOG_CHUNK_SIZE);
    console.log(`[Feedback API] ${endpointName} [${index + 1}/${totalChunks}] ${chunk}`);
  }

  return response;
};

const shipmentFeedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeedbackByLogon: builder.query<AppResponse<unknown>, string>({
      query: (logon) => ({
        url: `/transporter/feedback/by-logon/${encodeURIComponent(logon)}`,
      }),
      transformResponse: (response: AppResponse<unknown>) =>
        logFeedbackResponse('getFeedbackByLogon', response),
      providesTags: ['Shipments'],
    }),
    searchFeedback: builder.query<AppResponse<unknown>, ShipmentFeedbackSearchFilter>({
      query: (body) => ({
        url: '/transporter/feedback/search',
        method: 'POST',
        body,
      }),
      transformResponse: (response: AppResponse<unknown>) =>
        logFeedbackResponse('searchFeedback', response),
      providesTags: ['Shipments'],
    }),
    getFeedbackById: builder.query<AppResponse<unknown>, number>({
      query: (id) => ({
        url: `/transporter/feedback/${id}`,
      }),
      transformResponse: (response: AppResponse<unknown>) =>
        logFeedbackResponse('getFeedbackById', response),
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
      transformResponse: (response: AppResponse<unknown>) =>
        logFeedbackResponse('precheckFeedbackEligibility', response),
      providesTags: ['Shipments'],
    }),
    createFeedback: builder.mutation<AppResponse<unknown>, ShipmentFeedbackCreateRequest>({
      query: (body) => ({
        url: '/transporter/feedback',
        method: 'POST',
        body,
      }),
      transformResponse: (response: AppResponse<unknown>) =>
        logFeedbackResponse('createFeedback', response),
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
