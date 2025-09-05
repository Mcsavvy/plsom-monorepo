"use client";

import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, Smartphone, Monitor, Tablet, Share, Plus, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PWAInstallPromptProps {
  variant?: "banner" | "modal" | "card";
  onDismiss?: () => void;
  autoShow?: boolean;
  delay?: number;
}

export function PWAInstallPrompt({ 
  variant = "banner", 
  onDismiss,
  autoShow = true,
  delay = 3000 
}: PWAInstallPromptProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    install, 
    getInstallInstructions 
  } = usePWA();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt
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

    // Show prompt if conditions are met
    if (autoShow && !isInstalled && !isDismissed && (isInstallable || isIOS)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, isInstalled, isDismissed, isInstallable, isIOS, delay]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    onDismiss?.();
  };

  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent;
    if (/iPad|Android.*Tablet|Tablet/i.test(userAgent)) {
      return <Tablet className="h-5 w-5" />;
    } else if (/Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return <Smartphone className="h-5 w-5" />;
    } else {
      return <Monitor className="h-5 w-5" />;
    }
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  // Banner variant
  if (variant === "banner") {
    return (
      <div className="bg-primary text-primary-foreground fixed top-0 left-0 right-0 z-50 p-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-3">
            {getDeviceIcon()}
            <div>
              <p className="font-medium">Install PLSOM LMS</p>
              <p className="text-sm opacity-90">
                {isIOS
                  ? "Add to home screen for the best experience"
                  : "Install our app for faster access and offline support"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={isIOS ? () => window.location.href = '/install' : handleInstall}
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

  // Modal variant
  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {getDeviceIcon()}
            </div>
            <CardTitle className="text-2xl">Install PLSOM LMS</CardTitle>
            <CardDescription>
              {isIOS
                ? "Add to your home screen for quick access"
                : "Install our app for a better experience"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    <span className="text-sm">Tap the Share button in Safari</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Select "Add to Home Screen"</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Tap "Add" to confirm</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Get faster loading, offline access, and push notifications.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={isIOS ? () => window.location.href = '/install' : handleInstall}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {isIOS ? "View Full Instructions" : "Install App"}
              </Button>
              <Button onClick={handleDismiss} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getDeviceIcon()}
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
              ? "Add PLSOM LMS to your home screen for quick access and a native app experience."
              : "Install our app for faster loading, offline access, and push notifications."}
          </CardDescription>
          
          <div className="flex gap-2">
            <Button 
              onClick={isIOS ? () => window.location.href = '/install' : handleInstall}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isIOS ? "View Instructions" : "Install App"}
            </Button>
          </div>

          {isIOS && (
            <div className="mt-4 text-muted-foreground bg-muted rounded-md p-3 text-sm">
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

export default PWAInstallPrompt;
