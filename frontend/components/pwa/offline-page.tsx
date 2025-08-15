"use client";

import { useState } from "react";
import { WifiOff, RefreshCw, Home, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      // Try to fetch a simple resource to check connectivity
      await fetch("/favicon.ico", { cache: "no-cache" });
      window.location.reload();
    } catch (error) {
      console.error("Error checking connection:", error);
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  const offlineFeatures = [
    {
      icon: BookOpen,
      title: "Cached Courses",
      description: "Access previously viewed course materials",
    },
    {
      icon: Users,
      title: "Profile Information",
      description: "View your saved profile and progress",
    },
    {
      icon: Home,
      title: "Navigation",
      description: "Browse through cached pages",
    },
  ];

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Offline Message */}
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="bg-muted mx-auto mb-4 w-fit rounded-full p-3">
              <WifiOff className="text-muted-foreground h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <CardDescription className="text-base">
              No internet connection detected. Some features may not be
              available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>

            <p className="text-muted-foreground text-sm">
              Check your internet connection and try again
            </p>
          </CardContent>
        </Card>

        {/* Available Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Offline</CardTitle>
            <CardDescription>
              Here's what you can still do while offline:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {offlineFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-muted/50 flex flex-col items-center space-y-2 rounded-lg p-4 text-center"
                >
                  <feature.icon className="text-primary h-6 w-6" />
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Courses
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="justify-start"
                disabled={isRetrying}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
                />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <h3 className="text-sm font-medium">💡 Tip</h3>
              <p className="text-muted-foreground text-xs">
                Install PLSOM LMS as an app for better offline experience and
                faster loading times.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OfflinePage;
