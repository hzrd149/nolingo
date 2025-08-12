# Web Push Notifications Implementation

This document describes the complete web push notifications system implemented for the Nolingo social media app.

## Overview

The push notification system allows users to receive real-time notifications for:

- New posts from other users
- Replies to their posts
- Mentions (future enhancement)

## Architecture

### Database Schema

The system uses three new database tables:

1. **`vapid_keys`** - Stores server VAPID keys for push authentication
2. **`push_subscriptions`** - Stores user push notification subscriptions
3. **`notification_preferences`** - Stores user notification preferences
4. **`replies`** - Stores post replies (new feature added)

### Core Components

1. **Server-side Push Service** (`lib/push-notifications.ts`)
   - Functional approach with individual exported functions
   - VAPID key auto-generation and management
   - Push notification sending logic
   - Notification preference management

2. **Client-side Push Client** (`lib/push-client.ts`)
   - Browser push notification subscription management
   - Permission handling
   - Service worker communication

3. **Service Worker** (`public/sw.js`)
   - Handles incoming push notifications
   - Notification display and click handling
   - Background processing

4. **API Endpoints**
   - `/api/notifications/vapid-key` - Get public VAPID key
   - `/api/notifications/subscribe` - Subscribe to notifications
   - `/api/notifications/unsubscribe` - Unsubscribe from notifications
   - `/api/notifications/preferences` - Manage notification preferences

5. **UI Integration**
   - Settings page with notification preferences
   - Permission request flow
   - Subscription management

## Setup Instructions

### 1. Database Migration

Run the database migration to create the new tables:

```bash
npm run db:generate
npm run db:migrate
```

### 2. Environment Variables (Optional)

Add to your `.env` file:

```env
VAPID_EMAIL=admin@yourdomain.com  # Optional, defaults to admin@nolingo.app
```

### 3. Server Initialization

The VAPID keys are automatically generated when the server starts. No manual setup required.

### 4. Client-side Service Worker

The service worker is automatically registered when users visit the settings page and interact with notifications.

## Usage

### For Users

1. **Enable Notifications**
   - Go to Settings page
   - Find "Push Notifications" section
   - Click "Enable Push Notifications"
   - Allow browser permission when prompted

2. **Manage Preferences**
   - Toggle notification types on/off
   - Changes are saved automatically

3. **Disable Notifications**
   - Click "Disable Push Notifications" in settings
   - This removes the subscription from the server

### For Developers

#### Sending Custom Notifications

```typescript
import { sendNotificationToUser } from "@/lib/push-notifications";

await sendNotificationToUser(userId, {
  title: "Custom Notification",
  body: "This is a custom notification",
  icon: "/favicon.ico",
  url: "/some-page",
  data: {
    type: "custom",
    customData: "value",
  },
});
```

#### Adding New Notification Types

1. Add new preference to `notification_preferences` table
2. Update notification preference UI in settings
3. Add notification sending logic where needed
4. Update service worker to handle new notification types

## Features

### Implemented Features ✅

- [x] Database schema with VAPID keys, subscriptions, and preferences
- [x] Auto-generating VAPID key management
- [x] Client-side subscription management
- [x] Service worker for notification handling
- [x] Settings page integration
- [x] New post notifications
- [x] Reply notifications
- [x] Subscription/unsubscription APIs
- [x] Notification preferences management
- [x] Browser compatibility checks
- [x] Invalid subscription cleanup

### Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile, iOS 16.4+)
- ✅ Edge (Desktop & Mobile)
- ❌ Internet Explorer (not supported)

### Security Features

- VAPID authentication for secure push delivery
- User permission-based subscriptions
- Server-side subscription validation
- Automatic cleanup of invalid subscriptions

### Error Handling

- Graceful degradation for unsupported browsers
- Automatic retry for failed notifications
- Invalid subscription cleanup
- Non-blocking notification failures (won't break app functionality)

## API Reference

### Client-side

```typescript
import { pushNotificationClient } from "@/lib/push-client";

// Check if notifications are supported
const isSupported = pushNotificationClient.isSupported();

// Get current permission state
const state = await pushNotificationClient.getPermissionState();

// Subscribe to notifications
await pushNotificationClient.subscribe();

// Unsubscribe from notifications
await pushNotificationClient.unsubscribe();
```

### Server-side

```typescript
import {
  subscribeUser,
  unsubscribeUser,
  sendNotificationToUser,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/push-notifications";

// Subscribe a user
await subscribeUser(userId, subscriptionData, userAgent);

// Send notification to user
await sendNotificationToUser(userId, notificationPayload);

// Get user preferences
const preferences = await getUserNotificationPreferences(userId);

// Update preferences
await updateUserNotificationPreferences(userId, { new_posts: false });
```

## Testing

### Testing Push Notifications

1. **Development Testing**
   - Use Chrome DevTools > Application > Service Workers
   - Test notification permissions and subscriptions
   - Simulate push events in DevTools

2. **Production Testing**
   - Test across different browsers
   - Test on mobile devices
   - Verify notification delivery and click handling

### Common Issues

1. **Service Worker Not Registering**
   - Check that `/sw.js` is accessible
   - Verify service worker syntax
   - Check browser console for errors

2. **Notifications Not Appearing**
   - Verify user has granted permission
   - Check if user has valid subscription
   - Test with browser DevTools

3. **VAPID Key Issues**
   - Check database for generated keys
   - Verify VAPID email configuration
   - Check web-push library integration

## Future Enhancements

- [ ] Notification scheduling
- [ ] Rich notifications with images
- [ ] Notification grouping
- [ ] Email notification fallback
- [ ] Push notification analytics
- [ ] Batch notification sending
- [ ] Notification templates
- [ ] A/B testing for notifications

## Performance Considerations

- Notifications are sent asynchronously to avoid blocking requests
- Invalid subscriptions are automatically cleaned up
- Batch processing for multiple user notifications
- Efficient database queries with proper indexing

## Troubleshooting

### Common Error Messages

1. **"Push notifications are not supported in your browser"**
   - User is on unsupported browser
   - Solution: Show graceful fallback message

2. **"Notification permission denied"**
   - User denied browser permission
   - Solution: Guide user to enable in browser settings

3. **"No VAPID keys found"**
   - Server initialization issue
   - Solution: Check database and server logs

4. **"Failed to save subscription to server"**
   - Server API issue
   - Solution: Check API endpoint and authentication

For additional support, check the server logs and browser console for detailed error messages.
