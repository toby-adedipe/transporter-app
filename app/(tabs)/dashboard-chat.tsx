import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, MarkdownViewer } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTransporterNumber } from '@/hooks/useTransporterNumber';
import { useChatWithTransporterBotMutation } from '@/store/api/transporterInsightsApi';
import { AI_INSIGHTS_API_KEY } from '@/constants/config';
import type { TransporterChatMessage, TransporterChatResponse } from '@/types/api';

interface UiChatMessage extends TransporterChatMessage {
  id: string;
  isError?: boolean;
}

interface HandoverState {
  emailSent: boolean;
  recipient?: string;
  reference?: string;
}

const STARTER_PROMPTS = [
  'Summarize my KPI performance for the current date range.',
  'Which shipments or trucks look delayed right now?',
  'What operational risks should I prioritize today?',
] as const;

const toMessageId = (): string =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const toRequestMessages = (messages: UiChatMessage[]): TransporterChatMessage[] =>
  messages.map(({ role, content }) => ({ role, content })).slice(-30);

const getChatErrorMessage = (error: unknown): string => {
  const fallbackMessage = 'I could not generate a response. Please try again.';
  if (!error || typeof error !== 'object') return fallbackMessage;

  const typedError = error as any;
  const status = typedError.status ?? typedError.originalStatus;
  const dataMessage =
    typeof typedError?.data?.message === 'string' ? typedError.data.message.trim() : '';
  const dataDetail =
    typeof typedError?.data?.detail === 'string' ? typedError.data.detail.trim() : '';

  if (dataMessage.toLowerCase().includes('not configured')) {
    return 'Chat is not configured. Missing AI insights API key.';
  }
  if (dataDetail.toLowerCase().includes('transporternumber') && dataDetail.toLowerCase().includes('claim')) {
    return 'Your login token is missing transporter scope for chat access. Please re-authenticate with a scoped account.';
  }

  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'Chat scope mismatch. Please contact support.';
  if (status === 422) return dataMessage || 'Message is invalid. Please adjust and try again.';
  if (status === 500 || status === 502) return 'Assistant is temporarily unavailable. Please retry.';

  if (dataDetail) return dataDetail;
  if (dataMessage) return dataMessage;
  if (typeof typedError.error === 'string' && typedError.error.trim().length > 0) return typedError.error;
  return fallbackMessage;
};

export default function DashboardChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const transporterNumber = useTransporterNumber();
  const { startDate, endDate } = useAppSelector((state) => state.filters.dateRange);
  const selectedRegion = useAppSelector((state) => state.filters.selectedRegion);
  const isInsightsConfigured = Boolean(AI_INSIGHTS_API_KEY);

  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [handoverState, setHandoverState] = useState<HandoverState | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);

  const [chatWithTransporterBot, { isLoading: isSending }] = useChatWithTransporterBotMutation();

  useFocusEffect(
    useCallback(() => {
      setDraft('');
      setMessages([]);
      setHandoverState(null);
      setIsEscalating(false);
    }, []),
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isSending, isEscalating]);

  const applyHandoverState = useCallback((response: TransporterChatResponse) => {
    if (!response?.result?.handoverTriggered) return;

    setHandoverState({
      emailSent: Boolean(response.result.handoverEmailSent),
      recipient: response.result.handoverRecipient,
      reference: response.result.handoverReference,
    });
  }, []);

  const canSend = useMemo(
    () =>
      isInsightsConfigured &&
      Boolean(transporterNumber) &&
      draft.trim().length > 0 &&
      !isSending &&
      !isEscalating,
    [draft, isEscalating, isInsightsConfigured, isSending, transporterNumber],
  );

  const canEscalate = useMemo(
    () =>
      isInsightsConfigured &&
      Boolean(transporterNumber) &&
      messages.length > 0 &&
      !isSending &&
      !isEscalating,
    [isEscalating, isInsightsConfigured, isSending, messages.length, transporterNumber],
  );

  const handleSendMessage = useCallback(
    async (rawContent: string) => {
      const content = rawContent.trim();
      if (!content || isSending || isEscalating || !isInsightsConfigured || !transporterNumber) return;

      const userMessage: UiChatMessage = {
        id: toMessageId(),
        role: 'user',
        content,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setDraft('');

      try {
        const response = await chatWithTransporterBot({
          transporterNumber,
          messages: toRequestMessages(nextMessages),
          startDate,
          endDate,
          region: selectedRegion,
          debug: false,
        }).unwrap();

        applyHandoverState(response);
        const reply = response?.result?.reply?.trim() || 'No response generated.';
        setMessages((current) => [
          ...current,
          {
            id: toMessageId(),
            role: 'assistant',
            content: reply,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: toMessageId(),
            role: 'assistant',
            content: getChatErrorMessage(error),
            isError: true,
          },
        ]);
      }
    },
    [
      chatWithTransporterBot,
      endDate,
      applyHandoverState,
      isEscalating,
      isInsightsConfigured,
      isSending,
      messages,
      selectedRegion,
      startDate,
      transporterNumber,
    ],
  );

  const handleEscalateToSupport = useCallback(async () => {
    if (!canEscalate || !transporterNumber) return;

    setIsEscalating(true);
    try {
      const response = await chatWithTransporterBot({
        transporterNumber,
        messages: toRequestMessages(messages),
        startDate,
        endDate,
        region: selectedRegion,
        debug: false,
        forceHandover: true,
      }).unwrap();

      applyHandoverState(response);
      const reply = response?.result?.reply?.trim();
      if (reply) {
        setMessages((current) => [
          ...current,
          {
            id: toMessageId(),
            role: 'assistant',
            content: reply,
          },
        ]);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: toMessageId(),
          role: 'assistant',
          content: getChatErrorMessage(error),
          isError: true,
        },
      ]);
    } finally {
      setIsEscalating(false);
    }
  }, [
    applyHandoverState,
    canEscalate,
    chatWithTransporterBot,
    endDate,
    messages,
    selectedRegion,
    startDate,
    transporterNumber,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Assistant</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {handoverState ? (
            <View
              style={[
                styles.handoverBanner,
                handoverState.emailSent ? styles.handoverBannerSuccess : styles.handoverBannerWarning,
              ]}
            >
              <View style={styles.handoverHeader}>
                <Text
                  style={[
                    styles.handoverTitle,
                    handoverState.emailSent ? styles.handoverTextSuccess : styles.handoverTextWarning,
                  ]}
                >
                  {handoverState.emailSent
                    ? 'Escalated to support successfully.'
                    : 'Escalation failed. Please try again.'}
                </Text>
                <View
                  style={[
                    styles.handoverChip,
                    handoverState.emailSent ? styles.handoverChipSuccess : styles.handoverChipWarning,
                  ]}
                >
                  <Text style={styles.handoverChipText}>
                    {handoverState.emailSent ? 'Escalated to support' : 'Escalation pending'}
                  </Text>
                </View>
              </View>
              {handoverState.reference ? (
                <Text style={styles.handoverMeta}>Reference: {handoverState.reference}</Text>
              ) : null}
              {handoverState.recipient ? (
                <Text style={styles.handoverMeta}>Recipient: {handoverState.recipient}</Text>
              ) : null}
            </View>
          ) : null}

          {!isInsightsConfigured ? (
            <EmptyState
              icon="sparkles-outline"
              title="Chat is not configured"
              subtitle="Set EXPO_PUBLIC_AI_INSIGHTS_API_KEY to enable transporter assistant chat"
            />
          ) : messages.length === 0 ? (
            <View style={styles.starterSection}>
              <Text style={styles.starterTitle}>Try one of these prompts</Text>
              {STARTER_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.starterCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    void handleSendMessage(prompt);
                  }}
                >
                  <Text style={styles.starterText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userMessageRow : styles.assistantMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                    message.isError ? styles.errorBubble : undefined,
                  ]}
                >
                  {isUser ? (
                    <Text style={[styles.messageText, styles.userMessageText]}>
                      {message.content}
                    </Text>
                  ) : (
                    <MarkdownViewer
                      content={message.content}
                      textColor={colors.textPrimary}
                    />
                  )}
                </View>
              </View>
            );
          })}

          {isSending && !isEscalating ? (
            <View style={[styles.messageRow, styles.assistantMessageRow]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.assistantMessageText}>Assistant is typing...</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.escalateButton, !canEscalate && styles.escalateButtonDisabled]}
            disabled={!canEscalate}
            onPress={() => {
              void handleEscalateToSupport();
            }}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={canEscalate ? colors.warning : colors.textTertiary}
            />
            <Text style={[styles.escalateButtonText, !canEscalate && styles.escalateButtonTextDisabled]}>
              {isEscalating ? 'Escalating...' : 'Escalate to Support'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.composerContainer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            editable={isInsightsConfigured && !isSending && !isEscalating}
            placeholder={
              isInsightsConfigured
                ? 'Ask about trucks, shipments, KPIs, or operational risks...'
                : 'Chat is unavailable until AI insights is configured'
            }
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            disabled={!canSend}
            onPress={() => {
              void handleSendMessage(draft);
            }}
          >
            <Ionicons name="send" size={18} color={canSend ? colors.surface : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  messagesContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  starterSection: {
    gap: spacing.sm,
  },
  starterTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  starterCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  starterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  handoverBanner: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  handoverBannerSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  handoverBannerWarning: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  handoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  handoverTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  handoverTextSuccess: {
    color: colors.success,
  },
  handoverTextWarning: {
    color: colors.warning,
  },
  handoverChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  handoverChipSuccess: {
    backgroundColor: colors.success,
  },
  handoverChipWarning: {
    backgroundColor: colors.warning,
  },
  handoverChipText: {
    fontSize: fontSize.xs,
    color: colors.surface,
    fontWeight: fontWeight.semibold,
  },
  handoverMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBubble: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  messageText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.surface,
  },
  assistantMessageText: {
    color: colors.textPrimary,
  },
  actionsContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  escalateButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  escalateButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  escalateButtonText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },
  escalateButtonTextDisabled: {
    color: colors.textTertiary,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: fontSize.base,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
});
