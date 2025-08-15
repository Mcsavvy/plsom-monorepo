"use client";

import { ReactNode } from "react";
import { PWAInstallButton, NetworkStatus, PWAPrompt } from "@/components/pwa";
import { MobileNavigation } from "./mobile-navigation";

interface MobileLayoutProps {
  children: ReactNode;
  showInstallButton?: boolean;
  installButtonVariant?: "button" | "banner" | "card";
  showNetworkStatus?: boolean;
  networkStatusVariant?: "minimal" | "banner" | "toast";
  showNavigation?: boolean;
  showInstallPrompt?: boolean;
  installPromptDelay?: number;
}

export function MobileLayout({
  children,
  showInstallButton = true,
  installButtonVariant = "banner",
  showNetworkStatus = true,
  networkStatusVariant = "toast",
  showNavigation = true,
  showInstallPrompt = true,
  installPromptDelay = 30000 // 30 seconds
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      {showInstallButton && installButtonVariant === "banner" && (
        <PWAInstallButton variant="banner" />
      )}

      {/* Network Status Banner */}
      {showNetworkStatus && networkStatusVariant === "banner" && (
        <NetworkStatus variant="banner" />
      )}

      {/* Mobile Navigation */}
      {showNavigation && <MobileNavigation />}

      {/* Main Content */}
      <main className={`relative ${showNavigation ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Network Status Toast */}
      {showNetworkStatus && networkStatusVariant === "toast" && (
        <NetworkStatus variant="toast" />
      )}

      {/* Install Button Card (if not banner) */}
      {showInstallButton && installButtonVariant === "card" && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <PWAInstallButton variant="card" />
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <PWAPrompt delay={installPromptDelay} />
      )}
    </div>
  );
}

export default MobileLayout;
