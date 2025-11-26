"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePWA } from "@/hooks/use-pwa";

interface PWAInstallButtonProps {
  variant?: "button" | "banner" | "card" | "link";
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
  showInstructions?: boolean;
}

export function PWAInstallButton({
  variant = "button",
  className = "",
  onInstall,
  onDismiss,
  showInstructions = false,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install, getInstallInstructions } =
    usePWA();

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = Math.floor(
        (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    onDismiss?.();
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // Link variant - redirects to install page
  if (variant === "link") {
    return (
      <Button
        variant="link"
        onClick={() => (window.location.href = "/install")}
        className={className}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Install App
      </Button>
    );
  }

  // Button variant
  if (variant === "button" && (isInstallable || isIOS)) {
    return (
      <Button
        onClick={
          isIOS ? () => (window.location.href = "/install") : handleInstallClick
        }
        variant="outline"
        size="sm"
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        {isIOS ? "Add to Home Screen" : "Install App"}
      </Button>
    );
  }

  // Banner variant
  if (variant === "banner" && (isInstallable || isIOS)) {
    return (
      <div
        className={`bg-primary text-primary-foreground absolute top-0 right-0 left-0 z-50 p-4 ${className}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5" />
            <div>
              <p className="font-medium">Install PLSOM LMS</p>
              <p className="text-sm opacity-90">
                {isIOS
                  ? "Tap Share → Add to Home Screen for the best experience"
                  : "Install our app for a better experience"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={
                isIOS
                  ? () => (window.location.href = "/install")
                  : handleInstallClick
              }
              variant="secondary"
              size="sm"
            >
              {isIOS ? "Instructions" : "Install"}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === "card" && (isInstallable || isIOS)) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="text-primary h-5 w-5" />
              <CardTitle className="text-lg">Install PLSOM LMS</CardTitle>
            </div>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            {isIOS
              ? "Add PLSOM LMS to your home screen for quick access and a native app experience. Tap the Share button and select 'Add to Home Screen'."
              : "Install our app for faster loading, offline access, and a native app experience."}
          </CardDescription>
          <Button
            onClick={
              isIOS
                ? () => (window.location.href = "/install")
                : handleInstallClick
            }
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isIOS ? "View Instructions" : "Install App"}
          </Button>

          {showInstructions && isIOS && (
            <div className="text-muted-foreground bg-muted rounded-md p-3 text-sm">
              <p className="mb-1 font-medium">Quick steps:</p>
              <ol className="space-y-1">
                <li>1. Tap the Share button (⬆️) in Safari</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to confirm</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default PWAInstallButton;
