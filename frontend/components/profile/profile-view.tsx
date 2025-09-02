"use client";

import { useState } from "react";
import { User, Mail, Phone, Edit3, Camera, Trash2, Loader2, Lock } from "lucide-react";

import { StudentProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"
import { toastError, toastSuccess } from "@/lib/utils";

interface ProfileViewProps {
  profile: StudentProfile;
  onEdit: () => void;
  onUploadPicture: (file: File) => Promise<void>;
  onDeletePicture: () => Promise<void>;
  isLoading?: boolean;
}

export function ProfileView({
  profile,
  onEdit,
  onUploadPicture,
  onDeletePicture,
  isLoading = false,
}: ProfileViewProps) {
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isDeletingPicture, setIsDeletingPicture] = useState(false);

  const displayName = (
    profile.title
      ? `${profile.title} ${profile.first_name} ${profile.last_name}`
      : `${profile.first_name} ${profile.last_name}`
  ).trim();

  const initials = displayName.split(' ').filter(n => n !== '').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploadingPicture(true);
    try {
      await onUploadPicture(file);
      toastSuccess("Profile picture uploaded successfully.");
    } catch (error) {
      toastError(error, "Failed to upload profile picture.");
    } finally {
      setIsUploadingPicture(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleDeletePicture = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setIsDeletingPicture(true);
    try {
      await onDeletePicture();
      toastSuccess("Profile picture deleted successfully.");
    } catch (error) {
      toastError(error, "Failed to delete profile picture.");
    } finally {
      setIsDeletingPicture(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isLoading}
            >
              <Edit3 className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isLoading}
            >
              <Lock className="h-4 w-4" />
              <span className="sr-only">Change Password</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage className="object-fit" src={profile.profile_picture || undefined} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            
            {/* Upload/Delete Picture Buttons */}
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploadingPicture || isDeletingPicture}
                  title="Upload profile picture"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full"
                  disabled={isUploadingPicture || isDeletingPicture}
                  title="Upload profile picture"
                >
                  {isUploadingPicture ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {profile.profile_picture && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700"
                  onClick={handleDeletePicture}
                  disabled={isUploadingPicture || isDeletingPicture}
                  title="Remove profile picture"
                >
                  {isDeletingPicture ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={profile.is_active ? "default" : "secondary"}>
                {profile.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={profile.is_setup_complete ? "default" : "outline"}>
                {profile.is_setup_complete ? "Setup Complete" : "Setup Pending"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{profile.first_name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{profile.last_name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact your administrator if needed.
            </p>
          </div>

          {profile.title && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Badge variant="outline">{profile.title}</Badge>
              </div>
            </div>
          )}

          {profile.whatsapp_number && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">WhatsApp Number</label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.whatsapp_number}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
