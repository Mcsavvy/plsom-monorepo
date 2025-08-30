import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { HttpError } from "@/hooks/axios";
import * as Sentry from "@sentry/nextjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to toast error messages with comprehensive error type handling
 * 
 * @param error - The error to display. Can be:
 *   - HttpError (custom error type from axios hook)
 *   - Error instance
 *   - String
 *   - Any other type
 * @param fallbackMessage - Default message to show if error doesn't match expected types
 * @param options - Additional toast options
 */
export function toastError(
  error: unknown,
  fallbackMessage: string = "An error occurred",
  options?: {
    duration?: number;
    dismissible?: boolean;
    prefix?: string;
  }
): void {
  let message: string;

  Sentry.captureException(error);

  // Handle custom HttpError type
  if (error && typeof error === "object" && "message" in error && "statusCode" in error) {
    const httpError = error as HttpError;
    message = httpError.message || fallbackMessage;
  }
  // Handle standard Error instances
  else if (error instanceof Error) {
    message = error.message || fallbackMessage;
  }
  // Handle string errors
  else if (typeof error === "string") {
    message = error || fallbackMessage;
  }
  // Handle objects with message property
  else if (error && typeof error === "object" && "message" in error) {
    const errorObj = error as { message: unknown };
    message = typeof errorObj.message === "string" ? errorObj.message : fallbackMessage;
  }
  // Fallback for any other type
  else {
    message = fallbackMessage;
  }

  // Ensure we have a valid message
  if (!message || message.trim() === "") {
    message = fallbackMessage;
  }

  // Show the error toast
  toast.error(options?.prefix ? `${options.prefix}: ${message}` : message, options);
}

/**
 * Utility function to toast success messages
 * 
 * @param message - The success message to display
 * @param options - Additional toast options
 */
export function toastSuccess(
  message: string,
  options?: {
    duration?: number;
    dismissible?: boolean;
  }
): void {
  toast.success(message, options);
}

/**
 * Utility function to toast warning messages
 * 
 * @param message - The warning message to display
 * @param options - Additional toast options
 */
export function toastWarning(
  message: string,
  options?: {
    duration?: number;
    dismissible?: boolean;
  }
): void {
  toast.warning(message, options);
}

/**
 * Utility function to toast info messages
 * 
 * @param message - The info message to display
 * @param options - Additional toast options
 */
export function toastInfo(
  message: string,
  options?: {
    duration?: number;
    dismissible?: boolean;
  }
): void {
  toast.info(message, options);
}
