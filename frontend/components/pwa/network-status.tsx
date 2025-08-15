"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NetworkStatusProps {
  variant?: "minimal" | "banner" | "toast";
  className?: string;
  showOnlineStatus?: boolean;
}

export function NetworkStatus({ 
  variant = "minimal",
  className = "",
  showOnlineStatus = false 
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      
      if (!online && isOnline) {
        // Going offline
        setIsOnline(false);
        setWasOffline(true);
      } else if (online && !isOnline) {
        // Coming back online
        setShowReconnecting(true);
        setTimeout(() => {
          setIsOnline(true);
          setShowReconnecting(false);
        }, 1000);
      }
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Don't show anything if online and we shouldn't show online status
  if (isOnline && !showOnlineStatus && !showReconnecting) {
    return null;
  }

  // Minimal variant - just an icon
  if (variant === "minimal") {
    return (
      <div className={`flex items-center ${className}`}>
        {showReconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
        ) : isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  }

  // Banner variant
  if (variant === "banner") {
    if (showReconnecting) {
      return (
        <div className={`bg-yellow-500 text-white p-3 ${className}`}>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      );
    }

    if (!isOnline) {
      return (
        <div className={`bg-red-500 text-white p-3 ${className}`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">You're offline</p>
                <p className="text-xs opacity-90">Some features may not be available</p>
              </div>
            </div>
            <Button 
              onClick={handleRetry}
              variant="secondary" 
              size="sm"
              className="text-red-700 hover:text-red-800"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (isOnline && wasOffline) {
      return (
        <div className={`bg-green-500 text-white p-3 ${className}`}>
          <div className="flex items-center justify-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online!</span>
          </div>
        </div>
      );
    }
  }

  // Toast variant
  if (variant === "toast") {
    if (showReconnecting) {
      return (
        <Card className={`fixed bottom-4 right-4 z-50 ${className}`}>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              <span className="text-sm">Reconnecting...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!isOnline) {
      return (
        <Card className={`fixed bottom-4 right-4 z-50 border-red-200 ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <WifiOff className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-red-700">You're offline</p>
                <p className="text-xs text-red-600 mt-1">
                  Check your connection and try again
                </p>
                <Button 
                  onClick={handleRetry}
                  variant="outline" 
                  size="sm"
                  className="mt-2 w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isOnline && wasOffline) {
      return (
        <Card className={`fixed bottom-4 right-4 z-50 border-green-200 ${className}`}>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Back online!</span>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return null;
}

export default NetworkStatus;
