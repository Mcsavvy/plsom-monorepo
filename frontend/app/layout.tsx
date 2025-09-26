import React from "react";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/provider/theme-provider";
import SessionProvider from "@/provider/session-provider";
import { GlobalTransitions } from "@/components/ui/global-transitions";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";
import "./mobile.css";
import { Toaster } from "sonner";

const staticMetadata: Metadata = {
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

export function generateMetadata(): Metadata {
  return {
    ...staticMetadata,
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

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
      <head>
        {/* iOS splash screen support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PLSOM LMS" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* iOS splash screen images */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-430x932.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-393x852.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-428x926.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-390x844.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-375x812.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" href="/splash-ios-414x896.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-ios-414x896@2x.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash-ios-375x667@2x.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/splash-ios-320x568@2x.png" />
        
        {/* Default splash screen for other devices */}
        <link rel="apple-touch-startup-image" href="/splash-ios-default.png" />
      </head>
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
