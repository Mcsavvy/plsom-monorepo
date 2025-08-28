"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../ui/loading-spinner";
import { PageTransition } from "../ui/page-transition";

interface PublicPageWrapperProps {
  children: ReactNode;
  // Whether to redirect authenticated users to a different page
  redirectIfAuthenticated?: boolean;
  // Redirect path for authenticated users (default: "/")
  redirectTo?: string;
  // Whether to show loading state during session restoration
  showLoading?: boolean;
  // Custom loading component
  loadingComponent?: ReactNode;
}

export function PublicPageWrapper({
  children,
  redirectIfAuthenticated = true,
  redirectTo = "/",
  showLoading = true,
  loadingComponent,
}: PublicPageWrapperProps) {
  const { isAuthenticated, user } = useAuth();
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if we're on the account-inactive page
    if (typeof window === "undefined") {
      return;
    }

    // Redirect authenticated active users if specified
    if (
      !loading &&
      isAuthenticated &&
      user?.isActive &&
      redirectIfAuthenticated
    ) {
      router.push(redirectTo);
    } else if (
      !loading &&
      isAuthenticated &&
      user &&
      !user.isActive
    ) {
      // Redirect inactive users to inactive page
      router.push("/account-inactive");
    }
  }, [
    isAuthenticated,
    session,
    loading,
    router,
    redirectTo,
    redirectIfAuthenticated,
    user
  ]);

  // Show loading state during session restoration
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return <LoadingSpinner />;
  }

  // If authenticated and redirect is enabled, don't render content
  // (the useEffect will handle the redirect)
  if (isAuthenticated && user?.isActive && redirectIfAuthenticated) {
    return null;
  }

  // Don't render content for inactive users (they'll be redirected)
  if (isAuthenticated && user && !user.isActive) {
    return null;
  }

  // Render the public content with page transitions
  return <PageTransition>{children}</PageTransition>;
}

export default PublicPageWrapper;