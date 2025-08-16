"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, Save, X, CheckCircle } from "lucide-react";

import { ChangePasswordRequestNew, changePasswordRequestSchema } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordChangeFormProps {
  email: string;
  onSave: (data: ChangePasswordRequestNew) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PasswordChangeForm({
  email,
  onSave,
  onCancel,
  isLoading = false,
}: PasswordChangeFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordRequestNew>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: ChangePasswordRequestNew) => {
    setError(null);
    setSuccess(false);
    
    try {
      await onSave(data);
      setSuccess(true);
      form.reset();
      
      // Auto close after success
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to change password. Please try again.");
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4 text-center"
          >
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Password Changed Successfully
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your password has been updated. You'll be redirected shortly.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="on">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}

          <input id="email" type="hidden" value={email} disabled/>

          <div className="space-y-2">
            <label htmlFor="current_password" className="text-foreground text-sm font-medium">
              Current Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                className="pr-10 pl-10"
                {...form.register("current_password")}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.current_password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.current_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="new_password" className="text-foreground text-sm font-medium">
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
                autoComplete="new-password"
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
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-foreground text-sm font-medium">
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
            {form.formState.errors.confirm_password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium mb-2">Password Requirements:</h4>
            <ul className="space-y-1 text-xs">
              <li>• At least 8 characters long</li>
              <li>• Must be different from your current password</li>
              <li>• Confirmation must match the new password</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
