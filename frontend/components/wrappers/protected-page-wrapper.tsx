"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { useRouter } from "next/navigation";

interface ProtectedPageWrapperProps {
  children: ReactNode;
  // Optional fallback component to show while checking authentication
  fallback?: ReactNode;
  // Optional redirect path (default: "/login")
  redirectTo?: string;
  // Whether to show loading state during session restoration
  showLoading?: boolean;
  // Custom loading component
  loadingComponent?: ReactNode;
}

export function ProtectedPageWrapper({
  children,
  fallback,
  redirectTo = "/login",
  showLoading = true,
  loadingComponent
}: ProtectedPageWrapperProps) {
  const { isAuthenticated } = useAuth();
  const { loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  // Show loading state during session restoration
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

export default ProtectedPageWrapper;
