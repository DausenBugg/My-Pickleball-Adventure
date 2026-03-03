import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { radii, shadows, spacing, typography } from '../theme/tokens';
import AnimatedPressable from './AnimatedPressable';

// ── Types ──

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ErrorToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

const ErrorToastContext = createContext<ErrorToastContextValue>({
  showToast: () => {},
  showError: () => {},
  showSuccess: () => {},
  showWarning: () => {},
});

export const useErrorToast = () => useContext(ErrorToastContext);

// ── Toast Card ──

const TOAST_DURATION = 4000;
const SLIDE_DURATION = 300;
const SCREEN_WIDTH = Dimensions.get('window').width;

const ICON_MAP: Record<ToastType, { name: string; colorKey: string }> = {
  error: { name: 'alert-circle', colorKey: 'error' },
  success: { name: 'checkmark-circle', colorKey: 'success' },
  warning: { name: 'warning', colorKey: 'warning' },
  info: { name: 'information-circle', colorKey: 'primary' },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDismiss(toast.id);
    });
  };

  const icon = ICON_MAP[toast.type];
  const iconColor =
    toast.type === 'error'
      ? colors.error
      : toast.type === 'success'
        ? colors.success
        : toast.type === 'warning'
          ? colors.warning
          : colors.primary;

  const borderColor =
    toast.type === 'error'
      ? colors.error
      : toast.type === 'success'
        ? colors.success
        : toast.type === 'warning'
          ? colors.warning
          : colors.primary;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor,
          marginBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <Ionicons name={icon.name as any} size={22} color={iconColor} style={styles.icon} />
        <View style={styles.cardContent}>
          <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={[styles.message, { color: colors.muted }]} numberOfLines={3}>
              {toast.message}
            </Text>
          ) : null}
        </View>
        <AnimatedPressable onPress={dismiss} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={colors.muted} />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

// ── Provider ──

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
    },
    []
  );

  const showError = useCallback(
    (title: string, message?: string) => showToast('error', title, message),
    [showToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showToast('warning', title, message),
    [showToast]
  );

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo(
    () => ({ showToast, showError, showSuccess, showWarning }),
    [showToast, showError, showSuccess, showWarning]
  );

  return (
    <ErrorToastContext.Provider value={contextValue}>
      {children}

      {/* Toast overlay — above everything */}
      {toasts.length > 0 && (
        <View style={styles.overlay} pointerEvents="box-none">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={handleDismiss} />
          ))}
        </View>
      )}
    </ErrorToastContext.Provider>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    ...shadows.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  message: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: 4,
  },
});
