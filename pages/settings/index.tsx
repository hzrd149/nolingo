import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SettingsLayout from "@/components/settings/SettingsLayout";
import ProfileSection from "@/components/settings/ProfileSection";
import PasswordSection from "@/components/settings/PasswordSection";
import NotificationSection from "@/components/settings/NotificationSection";

function SettingsContent() {
  return (
    <SettingsLayout>
      <ProfileSection />
      <PasswordSection />
      <NotificationProvider>
        <NotificationSection />
      </NotificationProvider>
    </SettingsLayout>
  );
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-2rem)] bg-base-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting to login
  }

  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}
