import { Metadata } from "next";
import { OnboardingForm } from "@/components/auth/onboarding-form";

interface OnboardingPageProps {
  params: Promise<{
    token: string;
  }>;
}

export const metadata: Metadata = {
  title: "Complete Account Setup",
  description: "Complete your PLSOM account setup using your invitation token",
};

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { token } = await params;
  return <OnboardingForm token={token} />;
}
