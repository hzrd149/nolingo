import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  NotificationPermissionState,
  getPermissionState,
  subscribe,
  unsubscribe,
} from "@/lib/notification-client";

interface NotificationPreferences {
  new_posts: boolean;
  post_replies: boolean;
  mentions: boolean;
}

interface AlertMessage {
  type: "success" | "error";
  text: string;
}

interface NotificationContextType {
  // Notification state
  notificationState: NotificationPermissionState;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreference: (
    preference: keyof NotificationPreferences,
    value: boolean,
  ) => Promise<void>;
  subscribeToNotifications: () => Promise<void>;
  unsubscribeFromNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;

  // UI state
  notificationLoading: boolean;
  message: AlertMessage | null;
  setMessage: (message: AlertMessage | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { status } = useSession();

  const [notificationState, setNotificationState] =
    useState<NotificationPermissionState>({
      supported: false,
      permission: "default",
      subscribed: false,
    });

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      new_posts: true,
      post_replies: true,
      mentions: true,
    });

  const [notificationLoading, setNotificationLoading] = useState(false);
  const [message, setMessage] = useState<AlertMessage | null>(null);

  // Load notification data
  useEffect(() => {
    const loadNotificationData = async () => {
      if (status !== "authenticated") return;

      try {
        // Get permission state
        const permissionState = await getPermissionState();
        setNotificationState(permissionState);

        // Get user preferences
        const response = await fetch("/api/notifications/preferences");
        if (response.ok) {
          const data = await response.json();
          setNotificationPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Error loading notification data:", error);
      }
    };

    loadNotificationData();
  }, [status]);

  const updateNotificationPreference = async (
    preference: keyof NotificationPreferences,
    value: boolean,
  ) => {
    const updatedPreferences = {
      ...notificationPreferences,
      [preference]: value,
    };
    setNotificationPreferences(updatedPreferences);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [preference]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }

      setMessage({
        type: "success",
        text: "Notification preferences updated successfully!",
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      // Revert the change on error
      setNotificationPreferences(notificationPreferences);
      setMessage({
        type: "error",
        text: "Failed to update notification preferences.",
      });
    }
  };

  const subscribeToNotifications = async () => {
    setNotificationLoading(true);
    try {
      await subscribe();
      const newState = await getPermissionState();
      setNotificationState(newState);
      setMessage({
        type: "success",
        text: "Successfully subscribed to push notifications!",
      });
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      setMessage({
        type: "error",
        text: "Failed to subscribe to push notifications. Please try again.",
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setNotificationLoading(true);
    try {
      await unsubscribe();
      const newState = await getPermissionState();
      setNotificationState(newState);
      setMessage({
        type: "success",
        text: "Successfully unsubscribed from push notifications.",
      });
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      setMessage({
        type: "error",
        text: "Failed to unsubscribe from push notifications. Please try again.",
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setNotificationLoading(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Test notification sent! Check your browser or device for the notification.",
        });
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to send test notification.",
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage({
        type: "error",
        text: "Failed to send test notification. Please try again.",
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  const value: NotificationContextType = {
    notificationState,
    notificationPreferences,
    updateNotificationPreference,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendTestNotification,
    notificationLoading,
    message,
    setMessage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
