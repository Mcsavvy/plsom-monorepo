"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isOnline: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isIOS: false,
    isOnline: true,
    deferredPrompt: null,
  });

  // Check if app is running in standalone mode (installed)
  const checkStandaloneMode = useCallback(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isFullscreen = window.matchMedia(
      "(display-mode: fullscreen)"
    ).matches;
    const isMinimalUI = window.matchMedia("(display-mode: minimal-ui)").matches;
    const isInWebView = (window.navigator as any).standalone === true;

    return isStandalone || isFullscreen || isMinimalUI || isInWebView;
  }, []);

  // Check if device is iOS
  const checkIfIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Install the PWA
  const install = useCallback(async (): Promise<boolean> => {
    if (!state.deferredPrompt) {
      return false;
    }

    try {
      await state.deferredPrompt.prompt();
      const choiceResult = await state.deferredPrompt.userChoice;

      setState(prev => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false,
      }));

      return choiceResult.outcome === "accepted";
    } catch (error) {
      console.error("Error installing PWA:", error);
      return false;
    }
  }, [state.deferredPrompt]);

  // Get installation instructions based on browser/platform
  const getInstallInstructions = useCallback(() => {
    if (state.isIOS) {
      return {
        title: "Install PLSOM LMS",
        steps: [
          "Tap the Share button (⬆️) in Safari",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to confirm",
        ],
      };
    }

    if (state.isInstallable) {
      return {
        title: "Install PLSOM LMS",
        steps: [
          "Tap the install button when prompted",
          "Or use your browser's menu to 'Install App'",
        ],
      };
    }

    return {
      title: "Add to Home Screen",
      steps: [
        "Use your browser's menu",
        "Look for 'Add to Home Screen' or 'Install App'",
      ],
    };
  }, [state.isIOS, state.isInstallable]);

  useEffect(() => {
    // Initialize state
    setState(prev => ({
      ...prev,
      isStandalone: checkStandaloneMode(),
      isInstalled: checkStandaloneMode(),
      isIOS: checkIfIOS(),
      isOnline: navigator.onLine,
    }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        deferredPrompt: e as BeforeInstallPromptEvent,
        isInstallable: true,
      }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isStandalone: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
    };

    // Listen for online/offline events
    const handleOnlineStatus = () => {
      setState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    };

    // Listen for display mode changes
    const handleDisplayModeChange = () => {
      setState(prev => ({
        ...prev,
        isStandalone: checkStandaloneMode(),
        isInstalled: checkStandaloneMode(),
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Watch for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [checkStandaloneMode, checkIfIOS]);

  return {
    ...state,
    install,
    getInstallInstructions,
    canInstall: state.isInstallable || state.isIOS,
  };
}
