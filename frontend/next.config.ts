import type { NextConfig } from "next";
import withSerwist from "@serwist/next";
import { SentryBuildOptions, withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
};

const serwistConfig = {
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
};


const sentryConfig = {
  org: "futurdevs",
  project: "plsom-student",
  // Only print logs for uploading source maps in CI
  // Set to `true` to suppress logs
  silent: !process.env.CI,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // capture component names
  reactComponentAnnotation: {
    enabled: true,
  },
  // Pass the auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
} as SentryBuildOptions


export default withSentryConfig(
  withSerwist(serwistConfig)(nextConfig),
  sentryConfig
);