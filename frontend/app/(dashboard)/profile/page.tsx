"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, RefreshCw, Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/auth";
import { useProfile } from "@/hooks/profile";
import { StudentProfile, UserUpdateRequest, ChangePasswordRequestNew } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { ProfileView } from "@/components/profile/profile-view";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { EnrollmentsSection } from "@/components/profile/enrollments-section";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, refreshCurrentUser } = useAuth();
  const { getStudentProfile, updateUserProfile, uploadProfilePicture, deleteProfilePicture, changePassword } = useProfile();
  const router = useRouter();

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const studentProfile = await getStudentProfile(user.id);
      setProfile(studentProfile);
    } catch (err: any) {
      setError(err?.message || "Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (data: UserUpdateRequest) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, data);
      // Refresh user session and profile data
      await refreshCurrentUser();
      await loadProfile();
      setIsEditing(false);
    } catch (err: any) {
      throw err; // Let the form component handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadPicture = async (file: File) => {
    try {
      await uploadProfilePicture(file);
      // Refresh user session and profile data
      await refreshCurrentUser();
      await loadProfile();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeletePicture = async () => {
    try {
      await deleteProfilePicture();
      // Refresh user session and profile data
      await refreshCurrentUser();
      await loadProfile();
    } catch (err: any) {
      throw err;
    }
  };

  const handleChangePassword = async (data: ChangePasswordRequestNew) => {
    try {
      await changePassword(data);
    } catch (err: any) {
      throw err;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Loading user information...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Loading your profile...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <RefreshCw className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Failed to Load Profile
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={loadProfile}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <p className="text-muted-foreground">Profile not found</p>
              <Button variant="outline" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/")}
                          className="shrink-0"
                      >
                          <ArrowLeft className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Back</span>
                      </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">My Profile</h1>
            
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {!isEditing && !isChangingPassword ? (
                <>
                  {/* Mobile: Show icons only, Desktop: Show text + icons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                    disabled={isLoading}
                    className="px-2 md:px-3"
                  >
                    <Lock className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Change Password</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProfile}
                    disabled={isLoading}
                    className="px-2 md:px-3"
                  >
                    <RefreshCw className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Refresh</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setIsEditing(false);
                  }}
                  disabled={isLoading}
                  className="px-2 md:px-3"
                >
                  <X className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Cancel</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Profile Section */}
          {isChangingPassword ? (
            <PasswordChangeForm
              email={user.email}
              onSave={handleChangePassword}
              onCancel={() => setIsChangingPassword(false)}
              isLoading={isUpdating}
            />
          ) : isEditing ? (
            <ProfileEditForm
              profile={profile}
              onSave={handleUpdateProfile}
              onCancel={() => setIsEditing(false)}
              isLoading={isUpdating}
            />
          ) : (
            <ProfileView
              profile={profile}
              onEdit={() => setIsEditing(true)}
              onUploadPicture={handleUploadPicture}
              onDeletePicture={handleDeletePicture}
              isLoading={isUpdating}
            />
          )}

          {/* Enrollments Section */}
          {!isEditing && !isChangingPassword && (
            <EnrollmentsSection enrollments={profile.enrollments} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
