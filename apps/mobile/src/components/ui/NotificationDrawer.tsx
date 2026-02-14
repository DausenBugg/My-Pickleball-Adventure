import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';

import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import { useAppTheme } from '../../theme';

type BasicNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  read: boolean;
  data?: Record<string, unknown> | null;
};

type NotificationDrawerProps = {
  open: boolean;
  panelWidth: number;
  slideAnim: Animated.Value;
  notifications: BasicNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  renderActions?: (notification: BasicNotification) => ReactNode;
};

export default function NotificationDrawer({
  open,
  panelWidth,
  slideAnim,
  notifications,
  onClose,
  onMarkRead,
  renderActions,
}: NotificationDrawerProps) {
  const { theme } = useAppTheme();

  const visible = useMemo(
    () => notifications.filter((notification) => !(notification.type === 'match_approval' && notification.read)),
    [notifications]
  );

  return (
    <>
      {open ? <Pressable style={[styles.overlay, { backgroundColor: theme.color.role.overlay }]} onPress={onClose} /> : null}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          {
            width: panelWidth,
            borderLeftColor: theme.color.role.border,
            backgroundColor: theme.color.role.surfaceAlt,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.header, { padding: theme.spacing.lg }]}>
          <Text
            style={{
              color: theme.color.role.textPrimary,
              fontFamily: theme.type.family.headingSemi,
              fontSize: theme.type.sizes.lg,
            }}
          >
            Notifications
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.color.role.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 36, gap: theme.spacing.sm }}>
          {visible.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
              <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>No notifications yet</Text>
            </GlassCard>
          ) : null}
          {visible.map((notification) => (
            <GlassCard
              key={notification.id}
              style={[
                !notification.read && {
                  borderColor: theme.color.role.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.color.role.textPrimary,
                  fontSize: theme.type.sizes.base,
                  fontFamily: theme.type.family.bodySemi,
                }}
              >
                {notification.title}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  color: theme.color.role.textSecondary,
                  fontSize: theme.type.sizes.sm,
                  fontFamily: theme.type.family.body,
                }}
              >
                {notification.message}
              </Text>
              {renderActions ? <View style={{ marginTop: theme.spacing.sm }}>{renderActions(notification)}</View> : null}
              {!notification.read ? (
                <PrimaryButton
                  secondary
                  label="Mark as read"
                  onPress={() => onMarkRead(notification.id)}
                  style={{ marginTop: theme.spacing.sm }}
                />
              ) : null}
            </GlassCard>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
