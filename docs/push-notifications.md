# App Configuration for Push Notifications

Push notifications are configured in `app.json` with the following setup:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#FF6B6B"
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

**Note**: The app uses the existing app icon for notifications. Custom notification sounds are not currently configured.

## For Development

During development with Expo Go, push notifications will work automatically without additional configuration.

## For Production

1. **iOS**: Set up Apple Push Notification service (APNs) certificates in your Apple Developer account
2. **Android**: Set up Firebase Cloud Messaging (FCM) in Firebase Console and download `google-services.json`

## Testing Push Notifications

1. Register a user and ensure they grant notification permissions
2. The app will automatically register the push token when logging in
3. When achievements are unlocked, push notifications will be sent automatically
4. You can also manually invoke the edge function:

```bash
curl -X POST https://fkvoktpgrkgwedvgnibt.supabase.co/functions/v1/send-push-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notificationIds": ["notification-id-here"]}'
```
