"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, Check } from "lucide-react";

import { useAuth } from "@/hooks/auth";
import { ForgotPasswordRequest, forgotPasswordSchema } from "@/types/auth";
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

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { requestPasswordReset } = useAuth();

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(data);
      setIsSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(
        err?.message || "Failed to send password reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="from-background to-secondary/20 flex items-center justify-center bg-gradient-to-br p-4">
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
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  We've sent a password reset link to your email address
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm">
                  If you don't see the email in your inbox, please check your
                  spam folder.
                </p>
                <p className="text-muted-foreground text-sm">
                  The reset link will expire in 24 hours for security reasons.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button asChild className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccess(false);
                    form.reset();
                  }}
                  className="w-full"
                >
                  Send Another Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="from-background to-secondary/20 flex items-center justify-center bg-gradient-to-br p-4">
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
              <CardDescription>
                Enter your email address and we'll send you a reset link
              </CardDescription>
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
                  htmlFor="email"
                  className="text-foreground text-sm font-medium"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10"
                    {...form.register("email")}
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
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
