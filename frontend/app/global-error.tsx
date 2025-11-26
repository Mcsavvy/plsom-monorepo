"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PLSOMBranding } from "@/components/ui/plsom-branding";
import { RefreshCw, AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-900 dark:to-slate-800">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <PLSOMBranding
                size="xl"
                showName={true}
                showSubtitle={true}
                orientation="vertical"
              />
            </div>

            {/* Error Content */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Application Error
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  We encountered a critical error. Please try refreshing the
                  page.
                </p>
                {process.env.NODE_ENV === "development" && error.message && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-left dark:border-red-800 dark:bg-red-900/20">
                    <p className="mb-1 text-sm font-medium text-red-800 dark:text-red-200">
                      Error Details:
                    </p>
                    <p className="font-mono text-xs break-words text-slate-600 dark:text-slate-400">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-center gap-3 pt-4">
                <Button
                  onClick={reset}
                  className="flex w-full items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 dark:border-slate-600"
                  onClick={() => (window.location.href = "/")}
                >
                  Go to Homepage
                </Button>
              </div>
            </div>

            {/* Additional Help */}
            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p>If this problem persists, please contact technical support.</p>
              <p className="text-xs">PLSOM - Perfect Love School of Ministry</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
