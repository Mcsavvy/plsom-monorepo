"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock, Phone, Loader2, Mail, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

import { useOnboarding } from "@/hooks/onboarding";
import { OnboardingRequest, onboardingRequestSchema } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLSOMBranding } from "@/components/ui/plsom-branding";

interface OnboardingFormProps {
  token: string;
  invitationData?: {
    email: string;
    role: string;
    cohort_name: string;
  };
  onSuccess?: () => void;
}

export function OnboardingForm({ token, invitationData, onSuccess }: OnboardingFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const { verifyInvitation, completeOnboarding } = useOnboarding();
  const router = useRouter();

  const form = useForm<OnboardingRequest>({
    resolver: zodResolver(onboardingRequestSchema),
    defaultValues: {
      token,
      first_name: "",
      last_name: "",
      password: "",
      password_confirm: "",
      title: "",
      whatsapp_number: "",
    },
  });

  // Verify invitation token on component mount if no invitation data
  useEffect(() => {
    if (!invitationData && token) {
      verifyToken();
    }
  }, [token, invitationData]);

  const verifyToken = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      await verifyInvitation({ token });
      // If verification succeeds, we'll get the data from the parent component
      // or we can redirect to show the form
    } catch (err: any) {
      setVerificationError(
        err?.message || "Invalid or expired invitation token. Please contact your administrator."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: OnboardingRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await completeOnboarding(data);
      onSuccess?.();
      // Redirect to login page after successful onboarding
      router.push("/login?message=Account setup complete. Please sign in with your new credentials.");
    } catch (err: any) {
      setError(
        err?.message || "Failed to complete onboarding. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
        <Card className="shadow-lg w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Verifying your invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
        <Card className="shadow-lg w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Invalid Invitation
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {verificationError}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="mt-4"
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <CardTitle className="text-2xl">Complete Your Account</CardTitle>
              <CardDescription>
                Set up your PLSOM account to get started
              </CardDescription>
            </div>
            {invitationData && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{invitationData.cohort_name}</span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="on">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
                >
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-foreground text-sm font-medium">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="first_name"
                      placeholder="First name"
                      className="pl-10"
                      {...form.register("first_name")}
                      disabled={isLoading}
                      autoComplete="given-name"
                    />
                  </div>
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-foreground text-sm font-medium">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="last_name"
                      placeholder="Last name"
                      className="pl-10"
                      {...form.register("last_name")}
                      disabled={isLoading}
                      autoComplete="family-name"
                    />
                  </div>
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={invitationData?.email || ""}
                    disabled
                    className="pl-10 bg-muted/50 cursor-not-allowed"
                    autoComplete="email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This email is associated with your invitation and cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-foreground text-sm font-medium">
                  Title (Optional)
                </label>
                <Select
                  value={form.watch("title") || ""}
                  onValueChange={(value) => form.setValue("title", value)}
                >
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder="Select a title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No title</SelectItem>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                    <SelectItem value="Rev.">Rev.</SelectItem>
                    <SelectItem value="Pastor">Pastor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp_number" className="text-foreground text-sm font-medium">
                  WhatsApp Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="+1234567890"
                    className="pl-10"
                    {...form.register("whatsapp_number")}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
                {form.formState.errors.whatsapp_number && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.whatsapp_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-foreground text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pr-10 pl-10"
                    {...form.register("password")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password_confirm" className="text-foreground text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="password_confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pr-10 pl-10"
                    {...form.register("password_confirm")}
                    disabled={isLoading}
                    autoComplete="new-password"
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
                {form.formState.errors.password_confirm && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.password_confirm.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
