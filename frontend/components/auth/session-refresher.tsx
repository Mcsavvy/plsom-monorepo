"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { HttpError } from "@/hooks/axios";

interface SessionRefresherProps {
  // Buffer time in milliseconds before token expires to refresh (default: 5 minutes)
  refreshBufferMs?: number;
  // Whether to show debug logs
  debug?: boolean;
}

export function SessionRefresher({
  refreshBufferMs = 5 * 60 * 1000, // 5 minutes default
  debug = process.env.NODE_ENV === "development",
}: SessionRefresherProps) {
  const { refreshLogin, logout } = useAuth();
  const { session } = useSession();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const log = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[SessionRefresher] ${message}`, ...args);
    }
  };

  const scheduleNextRefresh = () => {
    if (!session?.tokens.access_expires_at) {
      log("No access token expiration time found");
      return;
    }

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const expirationTime = new Date(session.tokens.access_expires_at).getTime();
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    const timeUntilRefresh = timeUntilExpiration - refreshBufferMs;

    log(
      `Token expires in ${Math.round(timeUntilExpiration / 1000)}s, will refresh in ${Math.round(timeUntilRefresh / 1000)}s`
    );

    if (timeUntilRefresh <= 0) {
      // Token expires very soon, refresh immediately
      log("Token expires soon, refreshing immediately");
      handleRefresh();
    } else {
      // Schedule refresh before expiration
      refreshTimeoutRef.current = setTimeout(() => {
        log("Scheduled refresh triggered");
        handleRefresh();
      }, timeUntilRefresh);
    }
  };

  const handleRefresh = async () => {
    if (!session) {
      log("No active session to refresh");
      return;
    }

    try {
      log("Attempting to refresh session");
      await refreshLogin();
      log("Session refreshed successfully");

      // Schedule next refresh after successful refresh
      scheduleNextRefresh();
    } catch (error: any) {
      log("Failed to refresh session:", error);

      // If the error is a 401, logout the user
      if (Object.hasOwn(error, "statusCode") && error.statusCode === 401) {
        console.log("401 error, logging out");
        logout();
      }

      // If refresh fails, try again in 1 minute
      refreshTimeoutRef.current = setTimeout(() => {
        log("Retrying refresh after failure");
        handleRefresh();
      }, 60 * 1000);
    }
  };

  const startPeriodicCheck = () => {
    // Check every minute for any changes in session state
    refreshIntervalRef.current = setInterval(() => {
      if (session) {
        log("Periodic check - session exists, ensuring refresh is scheduled");
        scheduleNextRefresh();
      } else {
        log("Periodic check - no session, clearing timeouts");
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
      }
    }, 60 * 1000); // Check every minute
  };

  const clearAllTimeouts = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Effect to handle session changes
  useEffect(() => {
    if (session) {
      log("Session detected, scheduling refresh");
      scheduleNextRefresh();
      startPeriodicCheck();
    } else {
      log("No session, clearing timeouts");
      clearAllTimeouts();
    }

    // Cleanup on unmount
    return () => {
      log("Component unmounting, clearing timeouts");
      clearAllTimeouts();
    };
  }, [session]);

  // Effect to handle refresh buffer changes
  useEffect(() => {
    if (session) {
      log(
        `Refresh buffer changed to ${refreshBufferMs}ms, rescheduling refresh`
      );
      scheduleNextRefresh();
    }
  }, [refreshBufferMs, session]);

  // This component doesn't render anything
  return null;
}

export default SessionRefresher;
