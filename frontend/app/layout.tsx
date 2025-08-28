import React from "react";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/provider/theme-provider";
import SessionProvider from "@/provider/session-provider";
import { GlobalTransitions } from "@/components/ui/global-transitions";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";
import "./mobile.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "PLSOM LMS - Perfect Love School of Ministry",
    template: "%s | PLSOM LMS",
  },
  description:
    "Learning Management System for Perfect Love School of Ministry - Empowering Ministry Leaders Through Quality Education",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PLSOM LMS - Perfect Love School of Ministry",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#4f46e5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SessionProvider>
            <ServiceWorkerRegister />
            <GlobalTransitions>
              {children}
            </GlobalTransitions>
          </SessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
