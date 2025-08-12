import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserProfile {
  id: number;
  username: string;
  display_name?: string;
  about?: string;
  picture_id?: number;
  location?: string;
  website?: string;
  learning_language?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!session?.user?.username) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
      } else {
        setError("Failed to fetch profile");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.username) {
      fetchProfile();
    }
  }, [session, status]);

  const refreshProfile = () => {
    fetchProfile();
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    isAuthenticated: status === "authenticated",
  };
}
