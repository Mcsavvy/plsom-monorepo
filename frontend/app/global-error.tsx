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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
          <div className="max-w-md w-full text-center space-y-8">
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
                <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-full p-4 border">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Application Error
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-base">
                  We encountered a critical error. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && error.message && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-left">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error Details:</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-words">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 justify-center pt-4">
                <Button 
                  onClick={reset} 
                  className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-300 dark:border-slate-600"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Homepage
                </Button>
              </div>
            </div>

            {/* Additional Help */}
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <p>If this problem persists, please contact technical support.</p>
              <p className="text-xs">PLSOM - Perfect Love School of Ministry</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
