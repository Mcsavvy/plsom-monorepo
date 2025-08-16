import { z } from "zod";

export const authUserSchema = z.object({
  id: z.number(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  title: z.string().nullable(),
  role: z.string(),
  whatsapp_number: z.string().nullable(),
  profile_picture: z.string().nullable(),
  is_setup_complete: z.boolean(),
  is_active: z.boolean(),
});

export const authTokensSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  access_expires_at: z.string(),
  refresh_expires_at: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  whatsappNumber?: string;
  profilePicture?: string;
  isActive: boolean;
  initials: string;
  displayName: string;
}

export const loginCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const loginResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  access_expires_at: z.string(),
  refresh_expires_at: z.string(),
  role: z.string(),
});

export const refreshTokenResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  access_expires_at: z.string(),
  refresh_expires_at: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const changePasswordSchema = z.object({
  uid: z.string(),
  token: z.string(),
  new_password: z.string(),
  confirm_password: z.string(),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

// Onboarding types
export const onboardingRequestSchema = z.object({
  token: z.uuid({ version: "v4" }),
  first_name: z.string().max(150),
  last_name: z.string().max(150),
  password: z.string().min(8),
  password_confirm: z.string().min(8),
  title: z.string().max(20).optional(),
  whatsapp_number: z.string().max(20).regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number").optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

export const onboardingResponseSchema = z.object({
  user_id: z.number(),
  email: z.email(),
  role: z.string(),
});

export const invitationVerifySchema = z.object({
  token: z.uuid(),
});

export const invitationVerifyResponseSchema = z.object({
  email: z.email(),
  role: z.string(),
  cohort_name: z.string(),
});

export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>;
export type InvitationVerifyRequest = z.infer<typeof invitationVerifySchema>;
export type InvitationVerifyResponse = z.infer<typeof invitationVerifyResponseSchema>;
