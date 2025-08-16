import { Metadata } from "next";
import { OnboardingForm } from "@/components/auth/onboarding-form";

interface OnboardingPageProps {
  params: {
    token: string;
  };
}

export const metadata: Metadata = {
  title: "Complete Account Setup",
  description: "Complete your PLSOM account setup using your invitation token",
};

export default function OnboardingPage({ params }: OnboardingPageProps) {
  return <OnboardingForm token={params.token} />;
}
