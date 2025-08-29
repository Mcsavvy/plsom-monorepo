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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 px-4">
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
            <div className="bg-destructive/10 border-destructive/20 rounded-full p-4 border">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground text-base">
              We encountered an unexpected error. This has been logged and we&apos;ll look into it.
            </p>
            {process.env.NODE_ENV === "development" && error.message && (
              <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md text-left">
                <p className="text-sm font-medium text-destructive mb-1">Error Details:</p>
                <p className="text-xs text-muted-foreground font-mono break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button onClick={reset} className="w-full sm:w-auto flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/" prefetch className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>If this problem persists, please contact support.</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Link href="/" prefetch className="hover:text-primary underline">
              Dashboard
            </Link>
            <span>•</span>
            <Link href="/profile" prefetch className="hover:text-primary underline">
              Profile
            </Link>
            <span>•</span>
            <Link href="/login" prefetch className="hover:text-primary underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
