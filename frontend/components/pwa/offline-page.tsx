"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Home, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function OfflinePage() {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);

        try {
            // Try to fetch a simple resource to check connectivity
            await fetch('/favicon.ico', { cache: 'no-cache' });
            window.location.reload();
        } catch (error) {
            setTimeout(() => setIsRetrying(false), 2000);
        }
    };

    const offlineFeatures = [
        {
            icon: BookOpen,
            title: "Cached Courses",
            description: "Access previously viewed course materials"
        },
        {
            icon: Users,
            title: "Profile Information",
            description: "View your saved profile and progress"
        },
        {
            icon: Home,
            title: "Navigation",
            description: "Browse through cached pages"
        }
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
                {/* Main Offline Message */}
                <Card className="text-center">
                    <CardHeader className="pb-4">
                        <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                            <WifiOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-2xl">You're Offline</CardTitle>
                        <CardDescription className="text-base">
                            No internet connection detected. Some features may not be available.
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
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Checking Connection...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </>
                            )}
                        </Button>

                        <p className="text-sm text-muted-foreground">
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
                                <div key={index} className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                    <h3 className="font-medium text-sm">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground">{feature.description}</p>
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
                                    <Home className="h-4 w-4 mr-2" />
                                    Home
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="justify-start">
                                <Link href="/courses">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Courses
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="justify-start">
                                <Link href="/profile">
                                    <Users className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRetry}
                                className="justify-start"
                                disabled={isRetrying}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                                Retry Connection
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <h3 className="font-medium text-sm">💡 Tip</h3>
                            <p className="text-xs text-muted-foreground">
                                Install PLSOM LMS as an app for better offline experience and faster loading times.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default OfflinePage;