"use client";

import { useCallback, useMemo } from "react";
import { useClient } from "./axios";
import {
  StudentProfile,
  studentProfileSchema,
  UserUpdateRequest,
  AuthUser,
  authUserSchema,
  ChangePasswordRequestNew,
} from "@/types/auth";

async function _getStudentProfile(
  client: ReturnType<typeof useClient>,
  userId: number
): Promise<StudentProfile> {
  const response = await client.get<StudentProfile>(`/students/${userId}/`);
  if (response.status === 200) {
    const studentProfile = studentProfileSchema.parse(response.data);
    return studentProfile;
  }
  throw new Error("Failed to fetch student profile");
}

async function _updateUserProfile(
  client: ReturnType<typeof useClient>,
  userId: number,
  data: UserUpdateRequest
): Promise<AuthUser> {
  const response = await client.patch<AuthUser>(`/users/${userId}/`, data);
  if (response.status === 200) {
    const updatedUser = authUserSchema.parse(response.data);
    return updatedUser;
  }
  throw new Error("Failed to update user profile");
}

async function _uploadProfilePicture(
  client: ReturnType<typeof useClient>,
  file: File
): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("profile_picture", file);
  
  const response = await client.post<AuthUser>("/users/me/profile-picture/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  if (response.status === 200) {
    const updatedUser = authUserSchema.parse(response.data);
    const profilePicture = updatedUser.profile_picture?.replace("b2l/", "b2/");
    return { ...updatedUser, profile_picture: profilePicture ?? null };
  }
  throw new Error("Failed to upload profile picture");
}

async function _deleteProfilePicture(
  client: ReturnType<typeof useClient>
): Promise<AuthUser> {
  const response = await client.delete<AuthUser>("/users/me/profile-picture/");
  if (response.status === 200) {
    const updatedUser = authUserSchema.parse(response.data);
    return updatedUser;
  }
  throw new Error("Failed to delete profile picture");
}

async function _changePassword(
  client: ReturnType<typeof useClient>,
  data: ChangePasswordRequestNew
): Promise<void> {
  const response = await client.post("/auth/change-password/", data);
  if (response.status !== 200) {
    throw new Error("Failed to change password");
  }
}

export function useProfile() {
  const client = useClient();

  const getStudentProfile = useCallback(
    async (userId: number): Promise<StudentProfile> => {
      const studentProfile = await _getStudentProfile(client, userId);
      if (studentProfile.profile_picture) {
        studentProfile.profile_picture = studentProfile.profile_picture.replace("b2l/", "b2/");
      } else {
        studentProfile.profile_picture = null;
      }
      return studentProfile;
    },
    [client]
  );

  const updateUserProfile = useCallback(
    async (userId: number, data: UserUpdateRequest): Promise<AuthUser> => {
      return await _updateUserProfile(client, userId, data);
    },
    [client]
  );

  const uploadProfilePicture = useCallback(
    async (file: File): Promise<AuthUser> => {
      return await _uploadProfilePicture(client, file);
    },
    [client]
  );

  const deleteProfilePicture = useCallback(
    async (): Promise<AuthUser> => {
      return await _deleteProfilePicture(client);
    },
    [client]
  );

  const changePassword = useCallback(
    async (data: ChangePasswordRequestNew): Promise<void> => {
      return await _changePassword(client, data);
    },
    [client]
  );

  return {
    getStudentProfile,
    updateUserProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    changePassword,
  };
}
