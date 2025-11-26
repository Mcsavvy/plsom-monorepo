"use client";

import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./mobile-layout";
import { DesktopLayout } from "./desktop-layout";

interface ResponsiveLayoutProps {
  children: ReactNode;
  showInstallButton?: boolean;
  installButtonVariant?: "button" | "banner" | "card";
  showNetworkStatus?: boolean;
  networkStatusVariant?: "minimal" | "banner" | "toast";
  sidebarDefaultOpen?: boolean;
}

export function ResponsiveLayout({
  children,
  showInstallButton = true,
  installButtonVariant,
  showNetworkStatus = true,
  networkStatusVariant,
  sidebarDefaultOpen = true,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  // Set different defaults for mobile vs desktop
  const mobileInstallVariant = installButtonVariant || "banner";
  const desktopInstallVariant = installButtonVariant || "card";

  const mobileNetworkVariant = networkStatusVariant || "toast";
  const desktopNetworkVariant = networkStatusVariant || "minimal";

  if (isMobile) {
    return (
      <MobileLayout
        showInstallButton={showInstallButton}
        installButtonVariant={mobileInstallVariant}
        showNetworkStatus={showNetworkStatus}
        networkStatusVariant={mobileNetworkVariant}
      >
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout
      showInstallButton={showInstallButton}
      installButtonVariant={desktopInstallVariant}
      showNetworkStatus={showNetworkStatus}
      networkStatusVariant={desktopNetworkVariant}
      sidebarDefaultOpen={sidebarDefaultOpen}
    >
      {children}
    </DesktopLayout>
  );
}

export default ResponsiveLayout;
