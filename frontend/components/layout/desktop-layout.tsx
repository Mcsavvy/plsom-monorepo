"use client";

import { ReactNode } from "react";
import { PWAInstallButton, NetworkStatus } from "@/components/pwa";
import { PageTransition } from "@/components/ui/page-transition";
import { FeedbackButton } from "@/components/ui/feedback-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import DesktopNavigation from "./desktop-navigation";

interface DesktopLayoutProps {
  children: ReactNode;
  showInstallButton?: boolean;
  installButtonVariant?: "button" | "banner" | "card";
  showNetworkStatus?: boolean;
  networkStatusVariant?: "minimal" | "banner" | "toast";
  sidebarDefaultOpen?: boolean;
}

export function DesktopLayout({
  children,
  showInstallButton = true,
  installButtonVariant = "card",
  showNetworkStatus = true,
  networkStatusVariant = "minimal",
  sidebarDefaultOpen = true,
}: DesktopLayoutProps) {
  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <SidebarTrigger />
              <div className="text-sidebar-foreground font-semibold group-data-[collapsible=icon]:hidden">
                PLSOM LMS
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DesktopNavigation />
          </SidebarContent>
          <SidebarFooter>
            {/* PWA Install Button in Sidebar */}
            {showInstallButton && installButtonVariant === "button" && (
              <div className="px-2 py-1">
                <PWAInstallButton variant="button" />
              </div>
            )}

            {/* Feedback Button in Sidebar */}
            <div className="px-2 py-1">
              <FeedbackButton
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
              >
                Report Issue
              </FeedbackButton>
            </div>

            {/* Network Status in Sidebar */}
            {showNetworkStatus && networkStatusVariant === "minimal" && (
              <div className="flex items-center justify-center p-2">
                <NetworkStatus variant="minimal" />
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* PWA Install Banner */}
          {showInstallButton && installButtonVariant === "banner" && (
            <PWAInstallButton variant="banner" />
          )}

          {/* Network Status Banner */}
          {showNetworkStatus && networkStatusVariant === "banner" && (
            <NetworkStatus variant="banner" />
          )}

          {/* Main Content with Page Transitions */}
          <main className="flex-1 overflow-auto">
            <PageTransition>{children}</PageTransition>
          </main>

          {/* Network Status Toast */}
          {showNetworkStatus && networkStatusVariant === "toast" && (
            <NetworkStatus variant="toast" />
          )}

          {/* Install Button Card (floating) */}
          {showInstallButton && installButtonVariant === "card" && (
            <div className="fixed right-4 bottom-4 z-50">
              <PWAInstallButton variant="card" />
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default DesktopLayout;
