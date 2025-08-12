import { useSession } from "next-auth/react";

export function useSessionData() {
  const { data: session, status } = useSession();

  return {
    // Essential user data from session
    displayName: session?.user?.display_name,
    learningLanguage: session?.user?.learning_language,
    theme: session?.user?.theme || "light",
    username: session?.user?.username,

    // Session status
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",

    // Raw session for advanced use cases
    session,
    status,
  };
}
