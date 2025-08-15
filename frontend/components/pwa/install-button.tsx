"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallButtonProps {
  variant?: "button" | "banner" | "card";
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallButton({ 
  variant = "button", 
  className = "",
  onInstall,
  onDismiss 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // Check if running in browser display mode
    const isInWebView = (window.navigator as any).standalone === true;
    
    return isStandalone || isFullscreen || isMinimalUI || isInWebView;
  }, []);

  // Check if device is iOS
  const checkIfIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    setIsInstalled(checkIfInstalled());
    setIsIOS(checkIfIOS());

    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Always capture the event for potential use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Only prevent default if we want to show custom UI immediately
      if (variant === "banner" && !isDismissed) {
        e.preventDefault();
      } else if (variant === "card") {
        e.preventDefault();
      }
      // For "button" variant, let the browser handle it unless user clicks our button
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIfInstalled, checkIfIOS, onInstall, variant, isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt available, but user clicked install,
      // show them manual instructions
      console.log('No deferred prompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        onInstall?.();
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    onDismiss?.();
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    console.log("isInstalled", isInstalled);
    console.log("isDismissed", isDismissed);
    return null;
  }

  // Button variant
  if (variant === "button" && (isInstallable || isIOS)) {
    return (
      <Button 
        onClick={isIOS ? undefined : handleInstallClick}
        variant="outline" 
        size="sm"
        className={className}
        disabled={isIOS && !isInstallable}
      >
        <Download className="h-4 w-4 mr-2" />
        {isIOS ? "Add to Home Screen" : "Install App"}
      </Button>
    );
  }

  // Banner variant
  if (variant === "banner" && (isInstallable || isIOS)) {
    return (
      <div className={`absolute top-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-50 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5" />
            <div>
              <p className="font-medium">Install PLSOM LMS</p>
              <p className="text-sm opacity-90">
                {isIOS 
                  ? "Tap Share → Add to Home Screen for the best experience"
                  : "Install our app for a better experience"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isIOS && (
              <Button 
                onClick={handleInstallClick}
                variant="secondary" 
                size="sm"
              >
                Install
              </Button>
            )}
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
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Install PLSOM LMS</CardTitle>
            </div>
            <Button 
              onClick={handleDismiss}
              variant="ghost" 
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            {isIOS 
              ? "Add PLSOM LMS to your home screen for quick access and a native app experience. Tap the Share button and select 'Add to Home Screen'."
              : "Install our app for faster loading, offline access, and a native app experience."
            }
          </CardDescription>
          {!isIOS && (
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
          {isIOS && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              <p className="font-medium mb-1">How to install:</p>
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
