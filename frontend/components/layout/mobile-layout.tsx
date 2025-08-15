"use client";

import { ReactNode } from "react";
import { PWAInstallButton, NetworkStatus, PWAPrompt } from "@/components/pwa";
import MobileNavigation from "./mobile-navigation";

interface MobileLayoutProps {
  children: ReactNode;
  showInstallButton?: boolean;
  installButtonVariant?: "button" | "banner" | "card";
  showNetworkStatus?: boolean;
  networkStatusVariant?: "minimal" | "banner" | "toast";
}

export function MobileLayout({
  children,
  showInstallButton = true,
  installButtonVariant = "banner",
  showNetworkStatus = true,
  networkStatusVariant = "toast",
}: MobileLayoutProps) {
  return (
    <>
      {/* PWA Install Banner */}
      {showInstallButton && installButtonVariant === "banner" && (
        <PWAInstallButton variant="banner" />
      )}

      {/* Network Status Banner */}
      {showNetworkStatus && networkStatusVariant === "banner" && (
        <NetworkStatus variant="banner" />
      )}

      {/* Main Content */}
      <main className={`relative min-h-screen py-12 md:py-0`}>{children}</main>

      <MobileNavigation />

      {/* <PWAPrompt delay={1000} /> */}

      {/* Network Status Toast */}
      {showNetworkStatus && networkStatusVariant === "toast" && (
        <NetworkStatus variant="toast" />
      )}

      {/* Install Button Card (if not banner) */}
      {showInstallButton && installButtonVariant === "card" && (
        <div className="fixed right-4 bottom-4 left-4 z-40">
          <PWAInstallButton variant="card" />
        </div>
      )}
    </>
  );
}

export default MobileLayout;
