import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import "./globals.css";
import Drawer from "../components/Drawer";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();

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
