// Service Worker for handling push notifications
const NOTIFICATION_ICON = "/favicon.ico";
const NOTIFICATION_BADGE = "/favicon.ico";

self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  if (!event.data) {
    console.log("Push event has no data");
    return;
  }

  try {
    const payload = event.data.json();
    console.log("Push payload:", payload);

    const notificationOptions = {
      body: payload.body,
      icon: payload.icon || NOTIFICATION_ICON,
      badge: payload.badge || NOTIFICATION_BADGE,
      data: payload.data || {},
      tag: payload.data?.type || "nolingo-notification",
      requireInteraction: false,
      silent: false,
    };

    // Add action buttons based on notification type
    if (payload.data?.type === "new_post") {
      notificationOptions.actions = [
        {
          action: "view",
          title: "View Post",
          icon: "/favicon.ico",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ];
    }

    event.waitUntil(
      self.registration.showNotification(payload.title, notificationOptions),
    );
  } catch (error) {
    console.error("Error handling push event:", error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("Nolingo", {
        body: "You have a new notification",
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification click event:", event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // Close the notification
  notification.close();

  if (action === "dismiss") {
    return;
  }

  // Handle click actions
  const handleClick = async () => {
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    // Determine the URL to navigate to
    let urlToOpen = "/";

    if (data.url) {
      urlToOpen = data.url;
    } else if (data.postId) {
      urlToOpen = `/post/${data.postId}`;
    }

    // If there's already a window/tab open, focus it and navigate
    if (clients.length > 0) {
      const client = clients[0];
      await client.focus();

      if (client.navigate) {
        await client.navigate(urlToOpen);
      } else {
        // Fallback: post message to client to handle navigation
        client.postMessage({
          type: "NOTIFICATION_CLICK",
          url: urlToOpen,
          data: data,
        });
      }
    } else {
      // No existing window, open a new one
      await self.clients.openWindow(urlToOpen);
    }
  };

  event.waitUntil(handleClick());
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.data);
});

// Handle messages from the client
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync for failed requests (optional future enhancement)
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);

  if (event.tag === "notification-retry") {
    event.waitUntil(retryFailedNotifications());
  }
});

async function retryFailedNotifications() {
  // This could be implemented to retry failed notification sends
  console.log("Retrying failed notifications...");
}
