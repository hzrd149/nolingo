import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Nolingo",
  description: "Nolingo is a platform for learning languages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className="antialiased">
        <Providers>
          <div className="container mx-auto">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
