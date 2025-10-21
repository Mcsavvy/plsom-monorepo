"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";

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

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[SessionRefresher] ${message}`, ...args);
    }
  }, [debug]);

  const scheduleNextRefresh = useCallback(() => {
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
  }, [session, refreshBufferMs, log]);


  const handleRefresh = useCallback(async () => {
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

      // Handle undefined errors and authentication failures
      if (error === undefined || error === null) {
        log("Received undefined error during refresh, likely due to redirect");
        return;
      }

      // If the error is a 401, logout the user
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        console.log("401 error, logging out");
        logout();
        return; // Don't retry after logout
      }

      // If refresh fails, try again in 1 minute
      refreshTimeoutRef.current = setTimeout(() => {
        log("Retrying refresh after failure");
        handleRefresh();
      }, 60 * 1000);
    }
  }, [session, refreshLogin, scheduleNextRefresh, log, logout]);

  const startPeriodicCheck = useCallback(() => {
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
  }, [session, log, scheduleNextRefresh]);

  const clearAllTimeouts = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

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
  }, [session, log, clearAllTimeouts, scheduleNextRefresh, startPeriodicCheck]);


  // Effect to handle refresh buffer changes
  useEffect(() => {
    if (session) {
      log(
        `Refresh buffer changed to ${refreshBufferMs}ms, rescheduling refresh`
      );
      scheduleNextRefresh();
    }
  }, [refreshBufferMs, session, log, scheduleNextRefresh]);

  // This component doesn't render anything
  return null;
}

export default SessionRefresher;
