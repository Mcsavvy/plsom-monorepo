"use client";

import { useState, useEffect } from "react";
import { PWAInstallButton } from "./install-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Download, Zap, Wifi } from "lucide-react";

interface PWAPromptProps {
  delay?: number; // Delay in milliseconds before showing the prompt
  className?: string;
}

export function PWAPrompt({ delay = 5000, className = "" }: PWAPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      const isInWebView = (window.navigator as any).standalone === true;
      
      return isStandalone || isFullscreen || isMinimalUI || isInWebView;
    };

    // Check if user has already dismissed the prompt
    const checkIfDismissed = () => {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Show again after 30 days
        return daysSinceDismissed < 30;
      }
      return false;
    };

    setIsInstalled(checkIfInstalled());
    setIsDismissed(checkIfDismissed());

    // Show prompt after delay if not installed and not dismissed
    if (!checkIfInstalled() && !checkIfDismissed()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = () => {
    setShowPrompt(false);
  };

  // Don't show if installed, dismissed, or not ready
  if (isInstalled || isDismissed || !showPrompt) {
    return null;
  }

  const benefits = [
    {
      icon: Zap,
      title: "Faster Loading",
      description: "Lightning-fast performance"
    },
    {
      icon: Wifi,
      title: "Offline Access",
      description: "Works without internet"
    },
    {
      icon: Smartphone,
      title: "Native Feel",
      description: "App-like experience"
    }
  ];

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="max-w-md w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Install PLSOM LMS</CardTitle>
                <CardDescription className="text-sm">
                  Get the full app experience
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="mx-auto p-2 bg-muted rounded-lg w-fit">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-xs">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Install Button */}
          <PWAInstallButton
            variant="card"
            onInstall={handleInstall}
            onDismiss={handleDismiss}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PWAPrompt;
