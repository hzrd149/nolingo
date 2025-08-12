import { useSessionData } from "@/lib/hooks/useSessionData";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import {
  NotificationPermissionState,
  getPermissionState,
  subscribe,
  unsubscribe,
} from "@/lib/notification-client";
import ISO6391 from "iso-639-1";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface UserSettings {
  display_name: string;
  about: string;
  location: string;
  website: string;
  learning_language: string;
}

interface NotificationPreferences {
  new_posts: boolean;
  post_replies: boolean;
  mentions: boolean;
}

const LANGUAGE_OPTIONS = ISO6391.getAllNames()
  .map((name) => ({
    code: ISO6391.getCode(name),
    name: name,
  }))
  .filter((lang) => lang.code) // Filter out any undefined codes
  .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    profile,
    isLoading: profileLoading,
    refreshProfile,
  } = useUserProfile();
  const { displayName, learningLanguage } = useSessionData();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notification states
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

  const [settings, setSettings] = useState<UserSettings>({
    display_name: "",
    about: "",
    location: "",
    website: "",
    learning_language: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (profile) {
      setSettings({
        display_name: profile.display_name || "",
        about: profile.about || "",
        location: profile.location || "",
        website: profile.website || "",
        learning_language: profile.learning_language || "",
      });
    }
  }, [profile]);

  // Initialize settings from session data for essential fields
  useEffect(() => {
    if (displayName || learningLanguage) {
      setSettings((prev) => ({
        ...prev,
        display_name: displayName || "",
        learning_language: learningLanguage || "",
      }));
    }
  }, [displayName, learningLanguage]);

  // Load notification permission state and preferences
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

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Notification handlers
  const handleNotificationSubscribe = async () => {
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

  const handleNotificationUnsubscribe = async () => {
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

  const handleNotificationPreferenceChange = async (
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

  const handleTestNotification = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Basic validation
    if (settings.website && !settings.website.startsWith("http")) {
      setMessage({
        type: "error",
        text: "Website must start with http:// or https://",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings updated successfully!" });
        // Refresh profile data from the server
        await refreshProfile();
        // Force session refresh to update theme immediately
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.message || "Failed to update settings",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating settings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || profileLoading) {
    return (
      <div className="hero min-h-[calc(100vh-2rem)] bg-base-100">
        <div className="hero-content text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-base-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-base-content/70">
            Configure your account and application preferences.
          </p>
        </div>

        {message && (
          <div
            className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-6`}
          >
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Settings */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Profile Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Display Name
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="input input-bordered w-full"
                    value={settings.display_name}
                    onChange={(e) =>
                      handleInputChange("display_name", e.target.value)
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="input input-bordered w-full"
                    value={settings.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Website</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="input input-bordered w-full"
                    value={settings.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Learning Language
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={settings.learning_language}
                    onChange={(e) =>
                      handleInputChange("learning_language", e.target.value)
                    }
                  >
                    <option value="">Select a language</option>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">About</span>
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  className="textarea textarea-bordered w-full h-24"
                  value={settings.about}
                  onChange={(e) => handleInputChange("about", e.target.value)}
                  maxLength={500}
                />
                <label className="label">
                  <span className="label-text-alt">
                    {settings.about.length}/500 characters
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Push Notifications</h2>

              {!notificationState.supported ? (
                <div className="alert alert-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span>
                    Push notifications are not supported in your browser.
                  </span>
                </div>
              ) : (
                <>
                  {/* Subscription Status */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Notification Status
                      </span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div
                        className={`badge ${notificationState.subscribed ? "badge-success" : "badge-warning"}`}
                      >
                        {notificationState.subscribed
                          ? "Subscribed"
                          : "Not Subscribed"}
                      </div>
                      <div
                        className={`badge ${notificationState.permission === "granted" ? "badge-success" : notificationState.permission === "denied" ? "badge-error" : "badge-neutral"}`}
                      >
                        Permission: {notificationState.permission}
                      </div>
                    </div>
                  </div>

                  {/* Subscribe/Unsubscribe Button */}
                  <div className="form-control mt-4">
                    {notificationState.permission === "denied" ? (
                      <div className="alert alert-error">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          Notifications are blocked. Please enable them in your
                          browser settings.
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        {!notificationState.subscribed ? (
                          <button
                            type="button"
                            onClick={handleNotificationSubscribe}
                            className={`btn btn-primary ${notificationLoading ? "loading" : ""}`}
                            disabled={notificationLoading}
                          >
                            {notificationLoading
                              ? "Subscribing..."
                              : "Enable Push Notifications"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNotificationUnsubscribe}
                            className={`btn btn-outline btn-error ${notificationLoading ? "loading" : ""}`}
                            disabled={notificationLoading}
                          >
                            {notificationLoading
                              ? "Unsubscribing..."
                              : "Disable Push Notifications"}
                          </button>
                        )}

                        {/* Test Notification Button - only show if subscribed */}
                        {notificationState.subscribed && (
                          <button
                            type="button"
                            onClick={handleTestNotification}
                            className={`btn btn-outline btn-info ${notificationLoading ? "loading" : ""}`}
                            disabled={notificationLoading}
                          >
                            {notificationLoading
                              ? "Sending Test..."
                              : "Send Test Notification"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notification Preferences - only show if subscribed */}
                  {notificationState.subscribed && (
                    <div className="mt-6">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Notification Types
                        </span>
                      </label>

                      <div className="space-y-4">
                        {/* New Posts */}
                        <div className="form-control">
                          <label className="label cursor-pointer">
                            <span className="label-text">
                              <div className="flex flex-col">
                                <span className="font-medium">New Posts</span>
                                <span className="text-sm opacity-70">
                                  Get notified when new posts are published
                                </span>
                              </div>
                            </span>
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={notificationPreferences.new_posts}
                              onChange={(e) =>
                                handleNotificationPreferenceChange(
                                  "new_posts",
                                  e.target.checked,
                                )
                              }
                            />
                          </label>
                        </div>

                        {/* Post Replies */}
                        <div className="form-control">
                          <label className="label cursor-pointer">
                            <span className="label-text">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  Post Replies
                                </span>
                                <span className="text-sm opacity-70">
                                  Get notified when someone replies to your
                                  posts
                                </span>
                              </div>
                            </span>
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={notificationPreferences.post_replies}
                              onChange={(e) =>
                                handleNotificationPreferenceChange(
                                  "post_replies",
                                  e.target.checked,
                                )
                              }
                            />
                          </label>
                        </div>

                        {/* Mentions */}
                        <div className="form-control">
                          <label className="label cursor-pointer">
                            <span className="label-text">
                              <div className="flex flex-col">
                                <span className="font-medium">Mentions</span>
                                <span className="text-sm opacity-70">
                                  Get notified when someone mentions you
                                </span>
                              </div>
                            </span>
                            <input
                              type="checkbox"
                              className="toggle toggle-primary"
                              checked={notificationPreferences.mentions}
                              onChange={(e) =>
                                handleNotificationPreferenceChange(
                                  "mentions",
                                  e.target.checked,
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
