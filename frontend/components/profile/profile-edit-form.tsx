"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Phone, Loader2, Save, X } from "lucide-react";

import { UserUpdateRequest, userUpdateSchema, StudentProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_TITLE_OPTIONS, UserTitle } from "@/lib/constants";

interface ProfileEditFormProps {
  profile: StudentProfile;
  onSave: (data: UserUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
  isLoading = false,
}: ProfileEditFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserUpdateRequest>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      title: profile.title || undefined,
      whatsapp_number: profile.whatsapp_number || undefined,
    },
  });

  const onSubmit = async (data: UserUpdateRequest) => {
    setError(null);
    try {
      await onSave(data);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="title" className="text-foreground text-sm font-medium">
              Title (Optional)
            </label>
            <Select
              value={form.watch("title") || ""}
              onValueChange={(value) => form.setValue("title", value as UserTitle)}
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select a title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No title</SelectItem>
                {USER_TITLE_OPTIONS.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))}
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
