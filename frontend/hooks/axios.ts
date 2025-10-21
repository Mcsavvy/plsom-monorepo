"use client";
import config from "@/lib/config";
import axios, { AxiosError } from "axios";
import { useSession } from "./session";
import { useCallback, useMemo } from "react";
import * as Sentry from "@sentry/nextjs";

export interface ValidationErrors {
  [field: string]:
    | string
    | string[]
    | boolean
    | { key: string; message: string };
}

export interface HttpError extends Record<string, any> {
  message: string;
  statusCode: number;
  errors?: ValidationErrors;
}

// DRF Error Response Types
export interface DRFError {
  code: string;
  detail: string;
  attr?: string | null;
}

export interface DRFErrorResponse {
  type: "validation_error" | "client_error" | "server_error";
  errors: DRFError[];
  [key: string]: unknown;
}

// Custom validation errors type for simpler form handling
export interface SimpleValidationErrors {
  [field: string]: string[];
}

/**
 * Converts api errors to HttpError format
 * Handles both new DRF standardized format and legacy formats
 */
export const parseError = (error: AxiosError<DRFErrorResponse>): HttpError => {
  const statusCode = error.response?.status || 500;
  const responseData = error.response?.data;

  // Handle errors with message property
  if (responseData && responseData.message) {
    return {
      message: responseData.message as string,
      statusCode,
    };
  }

  // Handle errors with error property
  if (responseData && responseData.error) {
    return {
      message: responseData.error as string,
      statusCode,
    };
  }

  // Handle DRF standardized error format
  if (
    responseData &&
    responseData.type &&
    responseData.errors &&
    Array.isArray(responseData.errors)
  ) {
    const drfError = responseData as DRFErrorResponse;

    // Handle validation errors with field-specific messages
    if (drfError.type === "validation_error") {
      const validationErrors: SimpleValidationErrors = {};
      let primaryMessage = "Validation failed";

      drfError.errors.forEach(err => {
        if (err.attr && err.attr !== "non_field_errors") {
          // Field-specific error
          if (!validationErrors[err.attr]) {
            validationErrors[err.attr] = [];
          }
          validationErrors[err.attr].push(err.detail);
        } else {
          // Non-field error - use as primary message
          primaryMessage = err.detail;
        }
      });

      // Use the first field error as the main message if available
      if (Object.keys(validationErrors).length > 0) {
        const firstField = Object.keys(validationErrors)[0];
        primaryMessage = `${firstField}: ${validationErrors[firstField][0]}`;
      }

      return {
        message: primaryMessage,
        statusCode,
        errors: validationErrors,
      };
    }

    // Handle client errors (4xx) and server errors (5xx)
    const primaryError = drfError.errors[0];
    return {
      message: primaryError.detail,
      statusCode,
    };
  }

  // Handle legacy DRF error format (object with field keys)
  if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData)
  ) {
    const validationErrors: SimpleValidationErrors = {};
    let primaryMessage = "Validation failed";

    Object.keys(responseData).forEach(field => {
      const fieldErrors = responseData[field];
      if (Array.isArray(fieldErrors)) {
        validationErrors[field] = fieldErrors;
        if (!primaryMessage || primaryMessage === "Validation failed") {
          primaryMessage = `${field}: ${fieldErrors[0]}`;
        }
      }
    });

    return {
      message: primaryMessage,
      statusCode,
      errors: validationErrors,
    };
  }

  // Handle simple string error messages
  if (responseData && typeof responseData === "string") {
    return {
      message: responseData,
      statusCode,
    };
  }

  // Fallback for unknown error formats
  return {
    message: error.message || "An error occurred",
    statusCode,
  };
};

export function createAxiosInstance({
  token,
  onAuthFail,
}: {
  token?: string;
  onAuthFail?: () => void;
}) {
  // Request interceptor to add access token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const axiosInstance = axios.create({
    baseURL: config.apiUrl,
    headers,
  });
  axiosInstance.interceptors.request.use(
    config => config,
    error => {
      return Promise.reject(error);
    }
  );

  // Response interceptor with DRF error handling
  axiosInstance.interceptors.response.use(
    response => {
      return response;
    },
    error => {
      const customError = parseError(error);
      Sentry.captureException(customError);
      
      // Handle 401 errors with proper cleanup
      if (customError.statusCode === 401) {
        if (onAuthFail) {
          // Call onAuthFail but don't return its result to avoid undefined errors
          onAuthFail();
          // Return a proper error object instead of undefined
          return Promise.reject({
            message: "Authentication failed. Please log in again.",
            statusCode: 401
          });
        }
      }
      return Promise.reject(customError);
    }
  );
  return axiosInstance;
}

export function useClient() {
  const { session, clearSession } = useSession();
  const handleAuthFail = useCallback(() => {
    session && clearSession();
  }, [clearSession, session]);
  
  const client = useMemo(() => {
    if (!session) throw "No session is active";
    const axiosInstance = createAxiosInstance({
      token: session.tokens.access,
      onAuthFail: handleAuthFail,
    });
    return axiosInstance;
  }, [session?.tokens.access, handleAuthFail]);

  return client;
}
