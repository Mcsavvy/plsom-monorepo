"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLSOMBranding } from "@/components/ui/plsom-branding";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
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
          <div className="space-y-2">
            <h1 className="text-primary text-6xl font-bold">404</h1>
            <h2 className="text-foreground text-2xl font-semibold">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-base">
              Sorry, the page you&apos;re looking for doesn&apos;t exist or has
              been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/" prefetch className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex w-full items-center gap-2 sm:w-auto"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground space-y-2 text-sm">
          <p>Need help? Contact support or try:</p>
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
