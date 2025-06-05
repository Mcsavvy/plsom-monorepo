'use client'

import { Suspense } from 'react'
import  OnboardingFlow  from '@/components/onboarding/onboarding-flow'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <OnboardingFlow />
      </Suspense>
    </main>
  )
}