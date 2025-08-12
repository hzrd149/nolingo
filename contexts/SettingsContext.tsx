import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useSessionData } from "@/lib/hooks/useSessionData";

interface UserSettings {
  display_name: string;
  about: string;
  location: string;
  website: string;
  learning_language: string;
}

interface AlertMessage {
  type: "success" | "error";
  text: string;
}

interface SettingsContextType {
  // Profile state
  settings: UserSettings;
  updateSetting: (field: keyof UserSettings, value: string) => void;
  saveSettings: () => Promise<void>;

  // UI state
  isLoading: boolean;
  message: AlertMessage | null;
  setMessage: (message: AlertMessage | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { data: session, status } = useSession();
  const { profile, refreshProfile } = useUserProfile();
  const { displayName, learningLanguage } = useSessionData();

  const [settings, setSettings] = useState<UserSettings>({
    display_name: "",
    about: "",
    location: "",
    website: "",
    learning_language: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<AlertMessage | null>(null);

  // Initialize settings from profile data
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
        display_name: displayName || prev.display_name,
        learning_language: learningLanguage || prev.learning_language,
      }));
    }
  }, [displayName, learningLanguage]);

  const updateSetting = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
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

  const value: SettingsContextType = {
    settings,
    updateSetting,
    saveSettings,
    isLoading,
    message,
    setMessage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
