"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../ui/loading-spinner";

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
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for session to load

    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      router.push(redirectTo);
    } else if (session?.user && !session.user.is_active) {
      // User is authenticated but inactive, redirect to inactive page
      router.push("/account-inactive");
    }
  }, [isAuthenticated, session, loading, router, redirectTo]);

  // Show loading state during session restoration
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <LoadingSpinner/>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  // Don't render content for inactive users (they'll be redirected)
  if (session?.user && !session.user.is_active) {
    return null;
  }

  // User is authenticated and active, render the protected content
  return <>{children}</>;
}

export default ProtectedPageWrapper;
