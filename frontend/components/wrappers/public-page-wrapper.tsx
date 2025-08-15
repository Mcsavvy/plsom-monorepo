"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { useRouter } from "next/navigation";

interface PublicPageWrapperProps {
  children: ReactNode;
  // Whether to redirect authenticated users to a different page
  redirectIfAuthenticated?: boolean;
  // Redirect path for authenticated users (default: "/dashboard")
  redirectTo?: string;
  // Whether to show loading state during session restoration
  showLoading?: boolean;
  // Custom loading component
  loadingComponent?: ReactNode;
}

export function PublicPageWrapper({
  children,
  redirectIfAuthenticated = false,
  redirectTo = "/dashboard",
  showLoading = true,
  loadingComponent
}: PublicPageWrapperProps) {
  const { isAuthenticated } = useAuth();
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users if specified
    if (!loading && isAuthenticated && redirectIfAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo, redirectIfAuthenticated]);

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

  // If authenticated and redirect is enabled, don't render content
  // (the useEffect will handle the redirect)
  if (isAuthenticated && redirectIfAuthenticated) {
    return null;
  }

  // Render the public content
  return <>{children}</>;
}

export default PublicPageWrapper;
