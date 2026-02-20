import { baseApi } from '@/store/api/baseApi';
import { AI_INSIGHTS_API_KEY, AI_INSIGHTS_URL, API_BASE_URL } from '@/constants/config';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type {
  TransporterChatRequest,
  TransporterChatResponse,
  TransporterChatMessage,
} from '@/types/api';

interface TruckSearchParams {
  plate: string;
  transporterNumber: string;
  limit?: number;
}

const TRANSPORTER_INSIGHTS_CHAT_PATH = '/insights/transporter/chat';
const TRANSPORTER_INSIGHTS_TRUCK_SEARCH_PATH = '/insights/transporter/trucks/search';

const normalizeInsightsBaseUrl = (): string => {
  const preferredBase = AI_INSIGHTS_URL.trim() || API_BASE_URL.trim();
  if (!preferredBase) return '';

  return preferredBase
    .replace(/\/+$/, '')
    .replace(/\/insights\/transporter\/mobile-analysis\/?$/i, '')
    .replace(/\/insights\/transporter\/chat\/?$/i, '')
    .replace(/\/insights\/transporter\/trucks\/search\/?$/i, '');
};

const resolveInsightsUrl = (path: string): string => {
  const baseUrl = normalizeInsightsBaseUrl();
  if (!baseUrl) return '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const missingInsightsConfigError = (): FetchBaseQueryError =>
  ({
    status: 'CUSTOM_ERROR',
    data: { message: 'AI insights endpoint is not configured' },
    error: 'AI insights endpoint is not configured',
  }) as FetchBaseQueryError;

const ALLOWED_CHAT_ROLES = new Set<TransporterChatMessage['role']>(['user', 'assistant', 'system']);

const sanitizeMessages = (messages: TransporterChatMessage[]): TransporterChatMessage[] =>
  messages
    .filter((message) => ALLOWED_CHAT_ROLES.has(message.role))
    .map((message) => ({
      role: message.role,
      content: message.content?.trim() ?? '',
    }))
    .filter((message) => message.content.length > 0)
    .slice(-30);

const transporterInsightsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTruckLocationByPlate: builder.query<unknown, TruckSearchParams>({
      queryFn: async ({ plate, transporterNumber, limit = 5 }, _api, _extraOptions, baseQuery) => {
        if (!AI_INSIGHTS_API_KEY) {
          return { error: missingInsightsConfigError() };
        }

        const insightsUrl = resolveInsightsUrl(TRANSPORTER_INSIGHTS_TRUCK_SEARCH_PATH);
        if (!insightsUrl) {
          return { error: missingInsightsConfigError() };
        }

        const result = await baseQuery({
          url: insightsUrl,
          method: 'GET',
          params: {
            query: plate,
            limit,
            transporterNumber,
          },
          headers: {
            'X-API-Key': AI_INSIGHTS_API_KEY,
          },
        });

        return result.error
          ? { error: result.error as FetchBaseQueryError }
          : { data: result.data };
      },
      providesTags: ['Fleet'],
    }),
    chatWithTransporterBot: builder.mutation<TransporterChatResponse, TransporterChatRequest>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        if (!AI_INSIGHTS_API_KEY) {
          return { error: missingInsightsConfigError() };
        }

        const insightsUrl = resolveInsightsUrl(TRANSPORTER_INSIGHTS_CHAT_PATH);
        if (!insightsUrl) {
          return { error: missingInsightsConfigError() };
        }

        const result = await baseQuery({
          url: insightsUrl,
          method: 'POST',
          body: {
            ...body,
            messages: sanitizeMessages(body.messages),
            debug: body.debug ?? false,
          } satisfies TransporterChatRequest,
          headers: {
            'X-API-Key': AI_INSIGHTS_API_KEY,
          },
        });

        return result.error
          ? { error: result.error as FetchBaseQueryError }
          : { data: result.data as TransporterChatResponse };
      },
    }),
  }),
});

export const {
  useGetTruckLocationByPlateQuery,
  useChatWithTransporterBotMutation,
} = transporterInsightsApi;

