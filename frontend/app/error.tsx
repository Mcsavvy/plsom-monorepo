"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PLSOMBranding } from "@/components/ui/plsom-branding";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br px-4">
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
            <div className="bg-destructive/10 border-destructive/20 rounded-full border p-4">
              <AlertTriangle className="text-destructive h-12 w-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground text-base">
              We encountered an unexpected error. This has been logged and
              we&apos;ll look into it.
            </p>
            {process.env.NODE_ENV === "development" && error.message && (
              <div className="bg-destructive/5 border-destructive/20 mt-4 rounded-md border p-3 text-left">
                <p className="text-destructive mb-1 text-sm font-medium">
                  Error Details:
                </p>
                <p className="text-muted-foreground font-mono text-xs break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
            <Button
              onClick={reset}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/" prefetch className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground space-y-2 text-sm">
          <p>If this problem persists, please contact support.</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Link href="/" prefetch className="hover:text-primary underline">
              Dashboard
            </Link>
            <span>•</span>
            <Link
              href="/profile"
              prefetch
              className="hover:text-primary underline"
            >
              Profile
            </Link>
            <span>•</span>
            <Link
              href="/login"
              prefetch
              className="hover:text-primary underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
