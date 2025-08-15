import React from "react"
import type { Metadata } from "next";
import { ThemeProvider } from "@/provider/theme-provider";
import SessionProvider from "@/provider/session-provider";
import { SessionRefresher } from "@/components/session-refresher";
import { MobileLayout } from "@/components/layout/mobile-layout";
import "./globals.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "PLSOM LMS - Perfect Love School of Ministry",
  description:
    "Learning Management System for Perfect Love School of Ministry - Empowering Ministry Leaders Through Quality Education",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#4f46e5" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PLSOM LMS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-body">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <SessionRefresher />
            <MobileLayout>
              {children}
            </MobileLayout>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
