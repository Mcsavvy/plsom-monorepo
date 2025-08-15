import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./auth";
import { useSession } from "./session";

interface UseSessionRefresherOptions {
  // Buffer time in milliseconds before token expires to refresh (default: 5 minutes)
  refreshBufferMs?: number;
  // Whether to show debug logs
  debug?: boolean;
  // Whether to automatically start the refresher (default: true)
  autoStart?: boolean;
}

export function useSessionRefresher({
  refreshBufferMs = 5 * 60 * 1000, // 5 minutes default
  debug = false,
  autoStart = true,
}: UseSessionRefresherOptions = {}) {
  const { refreshLogin } = useAuth();
  const { session } = useSession();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[useSessionRefresher] ${message}`, ...args);
    }
  }, [debug]);

  const scheduleNextRefresh = useCallback(() => {
    if (!session?.tokens.access_expires_at || !isActiveRef.current) {
      log("No access token expiration time found or refresher not active");
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

    log(`Token expires in ${Math.round(timeUntilExpiration / 1000)}s, will refresh in ${Math.round(timeUntilRefresh / 1000)}s`);

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
    if (!session || !isActiveRef.current) {
      log("No active session to refresh or refresher not active");
      return;
    }

    try {
      log("Attempting to refresh session");
      await refreshLogin();
      log("Session refreshed successfully");
      
      // Schedule next refresh after successful refresh
      scheduleNextRefresh();
    } catch (error) {
      log("Failed to refresh session:", error);
      
      // If refresh fails, try again in 1 minute
      refreshTimeoutRef.current = setTimeout(() => {
        log("Retrying refresh after failure");
        handleRefresh();
      }, 60 * 1000);
    }
  }, [session, refreshLogin, scheduleNextRefresh, log]);

  const startPeriodicCheck = useCallback(() => {
    // Check every minute for any changes in session state
    refreshIntervalRef.current = setInterval(() => {
      if (session && isActiveRef.current) {
        log("Periodic check - session exists, ensuring refresh is scheduled");
        scheduleNextRefresh();
      } else {
        log("Periodic check - no session or refresher not active, clearing timeouts");
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
      }
    }, 60 * 1000); // Check every minute
  }, [session, scheduleNextRefresh, log]);

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

  const start = useCallback(() => {
    if (isActiveRef.current) {
      log("Refresher already active");
      return;
    }

    log("Starting session refresher");
    isActiveRef.current = true;
    
    if (session) {
      scheduleNextRefresh();
      startPeriodicCheck();
    }
  }, [session, scheduleNextRefresh, startPeriodicCheck, log]);

  const stop = useCallback(() => {
    if (!isActiveRef.current) {
      log("Refresher already stopped");
      return;
    }

    log("Stopping session refresher");
    isActiveRef.current = false;
    clearAllTimeouts();
  }, [clearAllTimeouts, log]);

  const restart = useCallback(() => {
    log("Restarting session refresher");
    stop();
    start();
  }, [stop, start]);

  // Effect to handle session changes
  useEffect(() => {
    if (session && isActiveRef.current) {
      log("Session detected, scheduling refresh");
      scheduleNextRefresh();
      startPeriodicCheck();
    } else if (!session) {
      log("No session, clearing timeouts");
      clearAllTimeouts();
    }
  }, [session, scheduleNextRefresh, startPeriodicCheck, clearAllTimeouts, log]);

  // Effect to handle refresh buffer changes
  useEffect(() => {
    if (session && isActiveRef.current) {
      log(`Refresh buffer changed to ${refreshBufferMs}ms, rescheduling refresh`);
      scheduleNextRefresh();
    }
  }, [refreshBufferMs, session, scheduleNextRefresh, log]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      log("Hook unmounting, clearing timeouts");
      clearAllTimeouts();
    };
  }, [autoStart, start, clearAllTimeouts, log]);

  return {
    start,
    stop,
    restart,
    isActive: isActiveRef.current,
  };
}
