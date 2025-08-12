import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";

import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import Drawer from "../components/Drawer";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Drawer>
          <Component {...pageProps} />
        </Drawer>
      </ThemeProvider>
    </SessionProvider>
  );
}
