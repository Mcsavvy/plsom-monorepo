import React from "react"
import type { Metadata } from "next";
import { ThemeProvider } from "@/provider/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLSOM LMS - Perfect Love School of Ministry",
  description:
    "Learning Management System for Perfect Love School of Ministry - Empowering Ministry Leaders Through Quality Education",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
