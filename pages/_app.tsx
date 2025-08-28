import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

import Drawer from "../components/AppLayout";

import "./globals.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      // Reset scroll position on route change
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
    };

    const handleRouteChangeComplete = () => {
      // Restore scroll position if available
      if (typeof window !== "undefined" && window.history.scrollRestoration) {
        window.history.scrollRestoration = "auto";
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
  }, [router]);

  // Check if current page is login
  const isLoginPage = router.pathname === "/login";

  return (
    <SessionProvider session={session}>
      {isLoginPage ? (
        // Render login page without Drawer layout
        <Component {...pageProps} />
      ) : (
        // Render all other pages with Drawer layout
        <Drawer>
          <Component {...pageProps} />
        </Drawer>
      )}
    </SessionProvider>
  );
}
