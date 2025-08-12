import { useSettings } from "@/contexts/SettingsContext";
import Head from "next/head";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { message, setMessage } = useSettings();

  return (
    <>
      <Head>
        <title>Settings - Nolingo</title>
      </Head>

      <div className="min-h-[calc(100vh-2rem)] bg-base-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-base-content mb-2">
              Settings
            </h1>
            <p className="text-base-content/70 text-sm sm:text-base">
              Configure your account and application preferences.
            </p>
          </div>

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

          {/* Settings Sections */}
          <div className="space-y-8">{children}</div>
        </div>
      </div>
    </>
  );
}
