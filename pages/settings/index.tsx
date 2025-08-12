import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Drawer from "@/components/Drawer";
import ISO6391 from "iso-639-1";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useSessionData } from "@/lib/hooks/useSessionData";

interface UserSettings {
  display_name: string;
  about: string;
  location: string;
  website: string;
  learning_language: string;
  theme: string;
}

const LANGUAGE_OPTIONS = ISO6391.getAllNames()
  .map((name) => ({
    code: ISO6391.getCode(name),
    name: name,
  }))
  .filter((lang) => lang.code) // Filter out any undefined codes
  .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

const THEME_OPTIONS = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    profile,
    isLoading: profileLoading,
    refreshProfile,
  } = useUserProfile();
  const {
    displayName,
    learningLanguage,
    theme: sessionTheme,
  } = useSessionData();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    display_name: "",
    about: "",
    location: "",
    website: "",
    learning_language: "",
    theme: "light",
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
        theme: profile.theme || "light",
      });
    }
  }, [profile]);

  // Initialize settings from session data for essential fields
  useEffect(() => {
    if (displayName || learningLanguage || sessionTheme) {
      setSettings((prev) => ({
        ...prev,
        display_name: displayName || "",
        learning_language: learningLanguage || "",
        theme: sessionTheme || "light",
      }));
    }
  }, [displayName, learningLanguage, sessionTheme]);

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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

          {/* Appearance Settings */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Appearance</h2>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Theme</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.theme}
                  onChange={(e) => handleInputChange("theme", e.target.value)}
                >
                  {THEME_OPTIONS.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </select>
                <label className="label">
                  <span className="label-text-alt">
                    Choose your preferred color scheme
                  </span>
                </label>

                {/* Theme Preview */}
                <div className="mt-4 p-4 border rounded-lg bg-base-100">
                  <p className="text-sm font-medium mb-2">Theme Preview:</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    <div className="w-4 h-4 rounded-full bg-secondary"></div>
                    <div className="w-4 h-4 rounded-full bg-accent"></div>
                    <div className="text-sm text-base-content/70">
                      {settings.theme.charAt(0).toUpperCase() +
                        settings.theme.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
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
