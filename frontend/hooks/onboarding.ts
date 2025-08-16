"use client";

import { useCallback, useMemo } from "react";
import { createAxiosInstance } from "./axios";
import {
  OnboardingRequest,
  OnboardingResponse,
  onboardingResponseSchema,
  InvitationVerifyRequest,
  InvitationVerifyResponse,
  invitationVerifyResponseSchema,
} from "@/types/auth";

async function _verifyInvitation(
  client: ReturnType<typeof createAxiosInstance>,
  data: InvitationVerifyRequest
): Promise<InvitationVerifyResponse> {
  const response = await client.post<InvitationVerifyResponse>(
    "/invitations/verify/",
    data
  );
  if (response.status === 200) {
    const verifyResponse = invitationVerifyResponseSchema.parse(response.data);
    return verifyResponse;
  }
  throw new Error("Failed to verify invitation");
}

async function _completeOnboarding(
  client: ReturnType<typeof createAxiosInstance>,
  data: OnboardingRequest
): Promise<OnboardingResponse> {
  const response = await client.post<OnboardingResponse>(
    "/invitations/onboard/",
    data
  );
  if (response.status === 201) {
    const onboardingResponse = onboardingResponseSchema.parse(response.data);
    return onboardingResponse;
  }
  throw new Error("Failed to complete onboarding");
}

export function useOnboarding() {
  const client = useMemo(() => {
    const axiosInstance = createAxiosInstance({});
    return axiosInstance;
  }, []);

  const verifyInvitation = useCallback(
    async (data: InvitationVerifyRequest): Promise<InvitationVerifyResponse> => {
      return await _verifyInvitation(client, data);
    },
    [client]
  );

  const completeOnboarding = useCallback(
    async (data: OnboardingRequest): Promise<OnboardingResponse> => {
      return await _completeOnboarding(client, data);
    },
    [client]
  );

  return {
    verifyInvitation,
    completeOnboarding,
  };
}
