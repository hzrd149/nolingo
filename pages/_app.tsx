import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";

import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
