import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useNotifications, Notification } from '../src/hooks/useNotifications';
import { colors, radii, spacing, typography } from '../src/theme';

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'achievement':
      return '🏆';
    case 'friend_request':
      return '👋';
    case 'match_approval':
      return '✅';
    case 'level_up':
      return '⬆️';
    default:
      return '📬';
  }
}

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationCard({ notification, onRead }: NotificationCardProps) {
  const timeAgo = (date: string) => {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <Pressable
      style={[
        styles.card,
        !notification.read && styles.cardUnread,
      ]}
      onPress={() => !notification.read && onRead(notification.id)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.read && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{timeAgo(notification.created_at)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.blue[600] },
          headerTintColor: colors.ink[0],
          headerTitleStyle: { fontWeight: typography.weights.bold },
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={markAllAsRead} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard notification={item} onRead={markAsRead} />
          )}
          style={styles.container}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink[950],
  },
  list: {
    padding: spacing.md,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.ink[900],
    borderRadius: radii.md,
    alignItems: 'flex-start',
  },
  cardUnread: {
    backgroundColor: colors.ink[900],
    borderWidth: 1,
    borderColor: colors.blue[600],
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink[0],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  unreadText: {
    fontWeight: typography.weights.bold,
  },
  message: {
    color: colors.ink[200],
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  time: {
    color: colors.ink[400],
    fontSize: typography.sizes.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.blue[600],
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.ink[950],
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.ink[400],
    fontSize: typography.sizes.md,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
  },
  headerButtonText: {
    color: colors.ink[0],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});


