import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  shadows,
  spacing,
} from '@/constants/theme';

type ToastTone = 'success' | 'warning' | 'danger' | 'info';

interface ToastOptions {
  message: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

interface ToastState extends Required<ToastOptions> {
  id: number;
}

const DEFAULT_DURATION = 4200;

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<
  ToastTone,
  { backgroundColor: string; borderColor: string; textColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: {
    backgroundColor: colors.successLight,
    borderColor: '#D0E4D8',
    textColor: colors.success,
    icon: 'checkmark-circle',
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderColor: '#E8DCC4',
    textColor: colors.warning,
    icon: 'warning',
  },
  danger: {
    backgroundColor: colors.dangerLight,
    borderColor: '#E4CCC9',
    textColor: colors.danger,
    icon: 'alert-circle',
  },
  info: {
    backgroundColor: colors.primaryLight,
    borderColor: '#D6DEEB',
    textColor: colors.primary,
    icon: 'information-circle',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const hideToast = useCallback((toastId?: number) => {
    clearTimer();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -16,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast((current) => {
          if (!current) return current;
          if (toastId !== undefined && current.id !== toastId) return current;
          return null;
        });
      }
    });
  }, [clearTimer, opacity, translateY]);

  const showToast = useCallback(
    ({ message, tone = 'danger', duration = DEFAULT_DURATION }: ToastOptions) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;
      clearTimer();
      setToast({
        id: Date.now(),
        message: trimmedMessage,
        tone,
        duration,
      });
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!toast) return;

    opacity.stopAnimation();
    translateY.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(-16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast(toast.id);
    }, toast.duration);

    return clearTimer;
  }, [clearTimer, hideToast, opacity, toast, translateY]);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  const toastTone = toast ? toneStyles[toast.tone] : null;

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {toast && toastTone ? (
          <View pointerEvents="box-none" style={styles.portal}>
            <Animated.View
              style={[
                styles.toast,
                {
                  top: Math.max(insets.top, spacing.base) + spacing.sm,
                  backgroundColor: toastTone.backgroundColor,
                  borderColor: toastTone.borderColor,
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <Ionicons
                name={toastTone.icon}
                size={20}
                color={toastTone.textColor}
                style={styles.toastIcon}
              />
              <Text style={[styles.toastText, { color: toastTone.textColor }]}>
                {toast.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                hitSlop={8}
                onPress={() => hideToast(toast.id)}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={18} color={toastTone.textColor} />
              </Pressable>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  portal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...shadows.lg,
  },
  toastIcon: {
    marginTop: 2,
  },
  toastText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontFamily: fontFamily.medium,
  },
  dismissButton: {
    marginLeft: spacing.sm,
    paddingVertical: 2,
  },
});
