import { HttpError } from '@refinedev/core';
import { AxiosError } from 'axios';

// DRF Error Response Types
export interface DRFError {
  code: string;
  detail: string;
  attr?: string | null;
}

export interface DRFErrorResponse {
  type: 'validation_error' | 'client_error' | 'server_error';
  errors: DRFError[];
  [key: string]: unknown;
}

// Custom validation errors type for simpler form handling
export interface SimpleValidationErrors {
  [field: string]: string[];
}

/**
 * Converts DRF standardized errors to HttpError format
 * Handles both new DRF standardized format and legacy formats
 */
export const convertDRFErrorToHttpError = (
  error: AxiosError<DRFErrorResponse>
): HttpError => {
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
    if (drfError.type === 'validation_error') {
      const validationErrors: SimpleValidationErrors = {};
      let primaryMessage = 'Validation failed';

      drfError.errors.forEach(err => {
        if (err.attr && err.attr !== 'non_field_errors') {
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
    typeof responseData === 'object' &&
    !Array.isArray(responseData)
  ) {
    const validationErrors: SimpleValidationErrors = {};
    let primaryMessage = 'Validation failed';

    Object.keys(responseData).forEach(field => {
      const fieldErrors = responseData[field];
      if (Array.isArray(fieldErrors)) {
        validationErrors[field] = fieldErrors;
        if (!primaryMessage || primaryMessage === 'Validation failed') {
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
  if (responseData && typeof responseData === 'string') {
    return {
      message: responseData,
      statusCode,
    };
  }

  // Fallback for unknown error formats
  return {
    message: error.message || 'An error occurred',
    statusCode,
  };
};

/**
 * Extracts validation errors from HttpError for form handling
 */
export const getValidationErrors = (
  error: HttpError
): SimpleValidationErrors => {
  const errors = error.errors || {};
  const simpleErrors: SimpleValidationErrors = {};

  Object.keys(errors).forEach(field => {
    const fieldError = errors[field];
    if (Array.isArray(fieldError)) {
      simpleErrors[field] = fieldError;
    } else if (typeof fieldError === 'string') {
      simpleErrors[field] = [fieldError];
    }
  });

  return simpleErrors;
};

/**
 * Gets the first error message for a specific field
 */
export const getFieldError = (
  errors: SimpleValidationErrors,
  fieldName: string
): string | undefined => {
  const fieldErrors = errors[fieldName];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
};

/**
 * Checks if an error is a validation error
 */
export const isValidationError = (error: HttpError): boolean => {
  return error.statusCode === 400 && Boolean(error.errors);
};

/**
 * Formats error message for display
 */
export const formatErrorMessage = (error: HttpError): string => {
  if (isValidationError(error)) {
    const validationErrors = getValidationErrors(error);
    const fieldNames = Object.keys(validationErrors);

    if (fieldNames.length === 1) {
      const fieldName = fieldNames[0];
      const fieldError = getFieldError(validationErrors, fieldName);
      return fieldError ? `${fieldName}: ${fieldError}` : error.message;
    } else if (fieldNames.length > 1) {
      return `Validation failed for ${fieldNames.length} fields`;
    }
  }

  return error.message;
};

/**
 * Creates a user-friendly error message from DRF error
 */
export const createUserFriendlyMessage = (error: HttpError): string => {
  switch (error.statusCode) {
    case 400:
      return isValidationError(error)
        ? formatErrorMessage(error)
        : 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in and try again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'A server error occurred. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};
