import { useNotifications } from "@/contexts/NotificationContext";
import FormToggle from "@/components/ui/FormToggle";
import LoadingButton from "@/components/ui/LoadingButton";
import SettingsSection from "./SettingsSection";

export default function NotificationSection() {
  const {
    notificationState,
    notificationPreferences,
    updateNotificationPreference,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendTestNotification,
    notificationLoading,
    message,
    setMessage,
  } = useNotifications();

  if (!notificationState.supported) {
    return (
      <>
        {/* Alert Messages */}
        {message && (
          <div className="mb-6">
            <div
              className={`alert ${
                message.type === "success" ? "alert-success" : "alert-error"
              }`}
            >
              <div className="flex items-start gap-3">
                {message.type === "success" ? (
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <div className="flex-1">
                  <span className="block sm:inline">{message.text}</span>
                </div>
                <button
                  onClick={() => setMessage(null)}
                  className="btn btn-ghost btn-sm btn-square"
                  aria-label="Close alert"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <SettingsSection
          title="Push Notifications"
          description="Manage your notification preferences to stay updated on new posts, replies, and mentions."
        >
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-warning">
                  Notifications Not Supported
                </h3>
                <p className="text-sm text-base-content/70 mt-1">
                  Push notifications are not supported in your current browser.
                  Please try using a modern browser like Chrome, Firefox, or
                  Safari.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>
      </>
    );
  }

  return (
    <>
      {/* Alert Messages */}
      {message && (
        <div className="mb-6">
          <div
            className={`alert ${
              message.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <div className="flex items-start gap-3">
              {message.type === "success" ? (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <div className="flex-1">
                <span className="block sm:inline">{message.text}</span>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close alert"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsSection
        title="Push Notifications"
        description="Manage your notification preferences to stay updated on new posts, replies, and mentions."
      >
        {/* Subscription Status */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-base-content mb-3">
              Notification Status
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`badge ${
                  notificationState.subscribed
                    ? "badge-success"
                    : "badge-warning"
                }`}
              >
                {notificationState.subscribed ? "Subscribed" : "Not Subscribed"}
              </div>
              <div
                className={`badge ${
                  notificationState.permission === "granted"
                    ? "badge-success"
                    : notificationState.permission === "denied"
                      ? "badge-error"
                      : "badge-neutral"
                }`}
              >
                Permission: {notificationState.permission}
              </div>
            </div>
          </div>

          {/* Subscribe/Unsubscribe Actions */}
          <div>
            {notificationState.permission === "denied" ? (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-error">
                      Notifications Blocked
                    </h3>
                    <p className="text-sm text-base-content/70 mt-1">
                      Notifications are blocked. Please enable them in your
                      browser settings and refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {!notificationState.subscribed ? (
                  <LoadingButton
                    onClick={subscribeToNotifications}
                    variant="primary"
                    loading={notificationLoading}
                    disabled={notificationLoading}
                  >
                    Enable Push Notifications
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    onClick={unsubscribeFromNotifications}
                    variant="outline"
                    loading={notificationLoading}
                    disabled={notificationLoading}
                  >
                    Disable Push Notifications
                  </LoadingButton>
                )}

                {notificationState.subscribed && (
                  <LoadingButton
                    onClick={sendTestNotification}
                    variant="ghost"
                    loading={notificationLoading}
                    disabled={notificationLoading}
                  >
                    Send Test Notification
                  </LoadingButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        {notificationState.subscribed && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-base-content">
              Notification Types
            </h3>

            <div className="space-y-4">
              <FormToggle
                label="New Posts"
                description="Get notified when new posts are published by users you follow"
                value={notificationPreferences.new_posts}
                onChange={(value) =>
                  updateNotificationPreference("new_posts", value)
                }
              />

              <FormToggle
                label="Post Replies"
                description="Get notified when someone replies to your posts"
                value={notificationPreferences.post_replies}
                onChange={(value) =>
                  updateNotificationPreference("post_replies", value)
                }
              />

              <FormToggle
                label="Mentions"
                description="Get notified when someone mentions you in a post or reply"
                value={notificationPreferences.mentions}
                onChange={(value) =>
                  updateNotificationPreference("mentions", value)
                }
              />
            </div>
          </div>
        )}
      </SettingsSection>
    </>
  );
}
