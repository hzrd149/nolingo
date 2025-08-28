export interface NotificationPermissionState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

export interface NotificationPreferences {
  new_posts: boolean;
  post_replies: boolean;
  mentions: boolean;
}

// Private state variables
let vapidPublicKey: string | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

/** Check if push notifications are supported in this browser */
export function isSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Get the current notification permission state */
export async function getPermissionState(): Promise<NotificationPermissionState> {
  const supported = isSupported();

  if (!supported) {
    return {
      supported: false,
      permission: "denied",
      subscribed: false,
    };
  }

  const permission = Notification.permission;
  const subscribed = await isSubscribed();

  return {
    supported: true,
    permission,
    subscribed,
  };
}

/** Request notification permission from the user */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported())
    throw new Error("Push notifications are not supported in this browser");

  const permission = await Notification.requestPermission();
  return permission;
}

/** Initialize the push notification client */
export async function initialize(): Promise<void> {
  if (!isSupported()) throw new Error("Push notifications are not supported");

  swRegistration = (await navigator.serviceWorker.getRegistration()) ?? null;

  // Check if service worker is already registered
  if (!swRegistration) {
    try {
      // Register service worker and wait for it to be ready
      swRegistration = await new Promise<ServiceWorkerRegistration>(
        (resolve, reject) => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("Service Worker registered started:", registration);

              // Wait for the service worker to be ready
              if (registration.installing) {
                console.log("Service Worker installing");
                registration.installing.addEventListener("statechange", () => {
                  if (registration.installing?.state === "installed") {
                    resolve(registration);
                  }
                });
                registration.installing.addEventListener("error", (error) => {
                  reject(
                    new Error(`Service worker installation failed: ${error}`),
                  );
                });
              } else if (registration.waiting) {
                console.log("Service Worker waiting");
                registration.waiting.addEventListener("statechange", () => {
                  if (registration.waiting?.state === "installed") {
                    resolve(registration);
                  }
                });
                registration.waiting.addEventListener("error", (error) => {
                  reject(new Error(`Service worker waiting failed: ${error}`));
                });
              } else if (registration.active) {
                console.log("Service Worker active");
                resolve(registration);
              } else {
                // If no worker is active, wait for one to become active
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => {
                    resolve(registration);
                  },
                );
              }
            })
            .catch(reject);
        },
      );
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  // Get VAPID public key if not already available
  if (!vapidPublicKey) {
    try {
      const response = await fetch("/api/notifications/vapid-key");
      if (!response.ok) throw new Error("Failed to get VAPID public key");

      const data = await response.json();
      vapidPublicKey = data.publicKey;
    } catch (error) {
      console.error("Failed to get VAPID public key:", error);
      throw error;
    }
  }
}

/** Subscribe to push notifications */
export async function subscribe(): Promise<void> {
  if (!swRegistration || !vapidPublicKey) await initialize();

  if (!swRegistration || !vapidPublicKey)
    throw new Error("Service worker or VAPID key not available");

  // Check permission
  const permission = await requestPermission();
  if (permission !== "granted")
    throw new Error("Notification permission denied");

  try {
    // Subscribe to push manager
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });

    // Send subscription to server
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription to server");
    }

    console.log("Successfully subscribed to push notifications");
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    throw error;
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribe(): Promise<void> {
  if (!swRegistration) await initialize();

  if (!swRegistration) throw new Error("Service worker not available");

  try {
    // Get current subscription
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription)
      // Unsubscribe from push manager
      await subscription.unsubscribe();

    // Remove subscription from server
    const response = await fetch("/api/notifications/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok)
      throw new Error("Failed to remove subscription from server");

    console.log("Successfully unsubscribed from push notifications");
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    throw error;
  }
}

/** Check if user is currently subscribed */
export async function isSubscribed(): Promise<boolean> {
  if (!isSupported()) return false;

  try {
    if (!swRegistration)
      swRegistration =
        (await navigator.serviceWorker.getRegistration()) || null;

    if (!swRegistration) return false;

    const subscription = await swRegistration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

/** Convert VAPID public key from URL Base64 to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);

  return outputArray;
}

/** Convert ArrayBuffer to Base64 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);

  return window.btoa(binary);
}
