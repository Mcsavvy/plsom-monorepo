"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/hooks/auth";
import { ChangePasswordRequest, changePasswordSchema } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLSOMBranding } from "@/components/ui/plsom-branding";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const searchParams = useSearchParams();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  useEffect(() => {
    // Validate required parameters
    if (!uid || !token) {
      setValidationError("Invalid reset link. Missing required parameters.");
    } else if (uid.length < 1 || token.length < 1) {
      setValidationError("Invalid reset link. Parameters are incomplete.");
    }

    setIsValidating(false);
  }, [uid, token]);

  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      uid: uid || "",
      token: token || "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: ChangePasswordRequest) => {
    setIsLoading(true);
    setError(null);

    // Check if passwords match
    if (data.new_password !== data.confirm_password) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(data);
      setIsSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to reset password. Please try again or request a new reset link."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating URL parameters
  if (isValidating) {
    return (
      <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground text-sm">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  // Error state for invalid URL parameters
  if (validationError) {
    return (
      <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <PLSOMBranding size="md" showName={false} />
              <div>
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm">
                  {validationError}
                </p>
                <p className="text-muted-foreground text-sm">
                  Reset links expire after 24 hours for security reasons.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request New Reset Link</Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Back to Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <PLSOMBranding />
              <div>
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  Password Reset Successful
                </CardTitle>
                <CardDescription>
                  Your password has been successfully updated
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm">
                  You can now sign in with your new password.
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <PLSOMBranding size="md" showName={false} />
            <div>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="new_password"
                  className="text-foreground text-sm font-medium"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    className="pr-10 pl-10"
                    {...form.register("new_password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.new_password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.new_password.message}
                  </p>
                )}
                <div className="text-muted-foreground text-xs">
                  Password must be at least 8 characters with uppercase,
                  lowercase, number, and special character
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className="text-foreground text-sm font-medium"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="pr-10 pl-10"
                    {...form.register("confirm_password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirm_password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 inline-flex items-center text-sm transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
