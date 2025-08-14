/**
 * Environment utilities for PLSOM Admin
 */

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.MODE === 'test';

/**
 * Get the appropriate document title handler based on environment
 */
export function getDocumentTitleHandler() {
  if (isDevelopment) {
    // In development, you might want to use the dev handler
    // import { plsomDevDocumentTitleHandler } from './documentTitleHandler';
    // return plsomDevDocumentTitleHandler;

    // For now, use the regular handler even in dev
    return null; // Will use the default handler
  }

  return null; // Will use the default handler
}

/**
 * Get app branding based on environment
 */
export function getAppBranding() {
  const baseBranding = {
    name: 'PLSOM Admin',
    shortName: 'PLSOM',
    description: 'Perfect Love School of Ministry Admin Portal',
  };

  return baseBranding;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isDevelopment,
    isProduction,
    isTest,
    apiUrl: import.meta.env.VITE_API_URL,
    appName: getAppBranding().name,
    enableDevTools: isDevelopment,
    enableErrorReporting: isProduction,
  };
}
