import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    // Set theme from session or default to 'light'
    const theme = session?.user?.theme || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, [session?.user?.theme]);

  return <>{children}</>;
}
