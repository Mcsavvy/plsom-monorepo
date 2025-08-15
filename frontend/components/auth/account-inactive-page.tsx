"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserX, Mail, Clock, AlertTriangle, RefreshCw, Home } from "lucide-react";

import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLSOMBranding } from "@/components/ui/plsom-branding";

export function AccountInactivePage() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { logout, refreshCurrentUser, isAuthenticated } = useAuth();
  const { session } = useSession();
  const router = useRouter();

  // Check if user is actually inactive or if they shouldn't be here
  useEffect(() => {
    if (isAuthenticated && session?.user?.is_active) {
      // User is active, redirect to dashboard
      router.push("/");
    } else if (!isAuthenticated) {
      // User is not logged in, redirect to login
      router.push("/login");
    }
  }, [isAuthenticated, session, router]);

  const handleCheckStatus = async () => {
    if (!isAuthenticated || !session) {
      router.push("/login");
      return;
    }

    setIsCheckingStatus(true);
    try {
      await refreshCurrentUser();
      
      // After refresh, check if user is now active
      if (session.user.is_active) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to check account status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const contactInfo = [
    {
      title: "Email Support",
      value: "support@plsom.org",
      icon: Mail,
    },
    {
      title: "Phone",
      value: "+1 (555) 123-4567",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <PLSOMBranding size="sm" showName showSubtitle />
            
            <div>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <UserX className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Account Inactive</CardTitle>
              <CardDescription>
                Your account has been deactivated and requires admin approval
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Account Status Info */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Access Restricted
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Your account has been temporarily deactivated. Please contact an administrator to reactivate your account.
                  </p>
                </div>
              </div>
            </div>

            {/* User Info (if available) */}
            {session?.user && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Account: <span className="font-medium">{session.user.email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Name: <span className="font-medium">
                    {session.user.first_name} {session.user.last_name}
                  </span>
                </p>
              </div>
            )}

            {/* What to do section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">What you can do:</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Wait for an administrator to reactivate your account
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Contact support for assistance with account reactivation
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Contact Information:</h3>
              
              <div className="space-y-2">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <contact.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{contact.title}:</span>
                    <span className="font-medium">{contact.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full"
                variant="outline"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Account Status
                  </>
                )}
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact support immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
