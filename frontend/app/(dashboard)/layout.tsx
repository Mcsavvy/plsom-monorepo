import React from "react";
import type { Metadata } from "next";
import { SessionRefresher } from "@/components/auth/session-refresher";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { ProtectedPageWrapper } from "@/components/wrappers";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedPageWrapper>
      <SessionRefresher />
      <ResponsiveLayout
        showInstallButton={true}
        showNetworkStatus={true}
        sidebarDefaultOpen={true}
      >
        {children}
      </ResponsiveLayout>
    </ProtectedPageWrapper>
  );
}
