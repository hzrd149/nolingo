"use client";

import { getPermissionState, subscribe } from "@/lib/notification-client";
import { useEffect, useState } from "react";
import { NotificationIcon } from "./Icons";

export default function NotificationPrompt({
  className,
}: {
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const checkNotificationState = async () => {
      try {
        const state = await getPermissionState();

        // Show prompt if notifications are supported but not granted or subscribed
        if (state.supported) {
          if (state.permission === "denied") {
            setPermissionDenied(true);
            setIsVisible(false);
          } else if (state.permission === "default" || !state.subscribed) {
            setPermissionDenied(false);
            setIsVisible(true);
          } else {
            // Permission granted and subscribed
            setIsVisible(false);
          }
        } else {
          // Notifications not supported
          setIsVisible(false);
        }
      } catch (error) {
        console.error("Error checking notification state:", error);
        setIsVisible(false);
      }
    };

    checkNotificationState();
  }, []);

  const handleEnable = async () => {
    try {
      setIsLoading(true);
      await subscribe();
      setIsVisible(false);
    } catch (error) {
      console.error("Failed to enable notifications:", error);

      // If permission was denied, update the state to show appropriate message
      const state = await getPermissionState();
      if (state.permission === "denied") {
        setPermissionDenied(true);
        setIsVisible(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleOpenSettings = () => {
    // Guide user to browser settings to enable notifications
    alert(
      "To enable notifications, please:\n\n" +
        "1. Click the lock or info icon in your browser's address bar\n" +
        "2. Find 'Notifications' in the permissions list\n" +
        "3. Change the setting to 'Allow'\n" +
        "4. Refresh this page",
    );
  };

  // Show permission denied message
  if (permissionDenied) {
    return (
      <div className={`alert alert-warning alert-subtle w-full ${className}`}>
        <NotificationIcon />
        <div className="flex-1 flex items-center gap-2">
          <div>
            <h3 className="font-bold">Notifications Blocked</h3>
            <div className="text-sm">
              Notifications are currently blocked. You can enable them in your
              browser settings to stay engaged with the community.
            </div>
          </div>
        </div>
        <div className="flex-none space-x-2 flex items-center ms-auto">
          <button
            onClick={handleOpenSettings}
            className="btn btn-primary btn-sm"
          >
            Open Settings
          </button>
          <button onClick={handleDismiss} className="btn btn-ghost btn-sm">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className={`alert alert-info alert-subtle w-full ${className}`}>
      <NotificationIcon />
      <div className="flex-1 flex items-center gap-2">
        <div>
          <h3 className="font-bold">Enable Notifications</h3>
          <div className="text-sm">
            Stay engaged with your language learning community. We'll ask for
            permission to send you notifications about new posts, replies, and
            mentions.
          </div>
        </div>
      </div>
      <div className="flex-none space-x-2 flex items-center ms-auto">
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Enable"
          )}
        </button>
        <button onClick={handleDismiss} className="btn btn-ghost">
          Dismiss
        </button>
      </div>
    </div>
  );
}
