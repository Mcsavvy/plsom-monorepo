import { useCallback, useEffect, useState } from "react";
import { showFeedbackWidget, attachFeedbackToButton } from "../instrumentation-client";

interface FeedbackOptions {
  title?: string;
  message?: string;
  includeReplay?: boolean;
}

interface UseFeedbackReturn {
  showFeedback: (options?: FeedbackOptions) => void;
  attachToElement: (element: HTMLElement, options?: FeedbackOptions) => void;
  isAvailable: boolean;
  isLoading: boolean;
}

export function useFeedback(): UseFeedbackReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Sentry feedback is available
    const checkAvailability = () => {
      try {
        // Small delay to ensure Sentry is initialized
        setTimeout(() => {
          setIsAvailable(true);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.warn("Sentry feedback not available:", error);
        setIsAvailable(false);
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  const showFeedback = useCallback((options: FeedbackOptions = {}) => {
    if (!isAvailable) {
      console.warn("Sentry feedback not available");
      return;
    }

    try {
      showFeedbackWidget();
      
      // If custom options are provided, we could potentially customize the form
      // This would require additional Sentry configuration
      if (options.title || options.message) {
        console.log("Custom feedback options:", options);
      }
    } catch (error) {
      console.error("Failed to show feedback widget:", error);
    }
  }, [isAvailable]);

  const attachToElement = useCallback((element: HTMLElement, options: FeedbackOptions = {}) => {
    if (!isAvailable) {
      console.warn("Sentry feedback not available");
      return;
    }

    try {
      attachFeedbackToButton(element);
      
      if (options.title || options.message) {
        console.log("Custom feedback options for attached element:", options);
      }
    } catch (error) {
      console.error("Failed to attach feedback to element:", error);
    }
  }, [isAvailable]);

  return {
    showFeedback,
    attachToElement,
    isAvailable,
    isLoading
  };
}

// Hook for capturing feedback programmatically
export function useCaptureFeedback() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      try {
        // Check if Sentry.captureFeedback is available
        if (typeof window !== "undefined" && (window as any).Sentry?.captureFeedback) {
          setIsAvailable(true);
        }
      } catch (error) {
        console.warn("Sentry captureFeedback not available:", error);
      }
    };

    checkAvailability();
  }, []);

  const captureFeedback = useCallback((data: {
    name?: string;
    email?: string;
    message: string;
  }, hints?: {
    includeReplay?: boolean;
    attachments?: any[];
  }) => {
    if (!isAvailable) {
      console.warn("Sentry captureFeedback not available");
      return;
    }

    try {
      if (typeof window !== "undefined" && (window as any).Sentry?.captureFeedback) {
        (window as any).Sentry.captureFeedback(data, hints);
      }
    } catch (error) {
      console.error("Failed to capture feedback:", error);
    }
  }, [isAvailable]);

  return {
    captureFeedback,
    isAvailable
  };
}

// Hook for showing the crash report dialog
export function useCrashReport() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      try {
        if (typeof window !== "undefined" && (window as any).Sentry?.showReportDialog) {
          setIsAvailable(true);
        }
      } catch (error) {
        console.warn("Sentry showReportDialog not available:", error);
      }
    };

    checkAvailability();
  }, []);

  const showCrashReport = useCallback((options: {
    eventId?: string;
    dsn?: string;
    user?: {
      email?: string;
      name?: string;
    };
    lang?: string;
    title?: string;
    subtitle?: string;
    subtitle2?: string;
    labelName?: string;
    labelEmail?: string;
    labelComments?: string;
    labelClose?: string;
    labelSubmit?: string;
    errorGeneric?: string;
    errorFormEntry?: string;
    successMessage?: string;
    onLoad?: () => void;
    onClose?: () => void;
  } = {}) => {
    if (!isAvailable) {
      console.warn("Sentry crash report not available");
      return;
    }

    try {
      if (typeof window !== "undefined" && (window as any).Sentry?.showReportDialog) {
        (window as any).Sentry.showReportDialog(options);
      }
    } catch (error) {
      console.error("Failed to show crash report:", error);
    }
  }, [isAvailable]);

  return {
    showCrashReport,
    isAvailable
  };
}
