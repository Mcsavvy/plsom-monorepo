'use client'

import { Suspense } from 'react'
import MultiStepOnboardingForm from '@/components/onboarding/multi-step-onboarding-form'
import OnboardingSuccess from '@/components/onboarding/onboarding-success'
import OnboardingError from '@/components/onboarding/onboarding-error'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type OnboardingStepType = 'validating' | 'form' | 'complete' | 'error'
type OnboardingErrorType = 'invalid_token' | 'expired_token' | 'validation_failed' | 'network_error'

interface InvitationData {
  email: string
  role: string
  program: string
  invitedBy: string
  cohort?: string
  expiresAt: Date
}

function OnboardingPageContent() {
  const [step, setStep] = useState<OnboardingStepType>('validating')
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<OnboardingErrorType>('validation_failed')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Validate invitation token
    const validateInvitation = async () => {
      const token = searchParams.get('token')
      
      // Development mode - allow access without token or use mock data
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (!token && !isDevelopment) {
        setError('No invitation token provided. Please use the complete invitation link from your email.')
        setErrorType('invalid_token')
        setStep('error')
        return
      }

      try {
        // Simulate network delay for realistic experience
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // For development, you can test different error scenarios by uncommenting:
        // throw new Error('EXPIRED_TOKEN')
        // throw new Error('INVALID_TOKEN') 
        // throw new Error('NETWORK_ERROR')
        
        // Mock invitation data (replace with actual API call)
        const mockInvitationData = {
          email: token ? 'invited.user@plsom.org' : 'dev.user@plsom.org',
          role: 'student',
          program: 'Certificate Level 2 Practical Ministry',
          invitedBy: 'Dr. Sarah Johnson',
          cohort: 'Fall 2025 Cohort',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
        
        setInvitationData(mockInvitationData)
        setStep('form')
        
      } catch (error) {
        console.error('Token validation failed:', error)
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        switch (errorMessage) {
          case 'EXPIRED_TOKEN':
            setError('Your invitation link has expired. Invitation links are valid for 7 days from when they were sent. Please contact your program administrator to request a new invitation.')
            setErrorType('expired_token')
            break
            
          case 'INVALID_TOKEN':
            setError('The invitation token is invalid or malformed. Please ensure you copied the complete link from your invitation email.')
            setErrorType('invalid_token')
            break
            
          case 'NETWORK_ERROR':
          case 'Failed to fetch':
            setError('Unable to connect to our servers. Please check your internet connection and try again.')
            setErrorType('network_error')
            break
            
          default:
            setError('Unable to validate your invitation. This may be due to an invalid or expired link. Please contact your administrator for assistance.')
            setErrorType('validation_failed')
            break
        }
        
        setStep('error')
      }
    }

    validateInvitation()
  }, [searchParams])

  const handleOnboardingComplete = () => {
    setStep('complete')
  }

  const handleReturnToLogin = () => {
    router.push('/')
  }

  // Validating state
  if (step === 'validating') {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 border-4 border-white border-t-transparent rounded-full mb-4 mx-auto"
          />
          <motion.p 
            className="text-white text-lg font-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Validating your invitation...
          </motion.p>
        </motion.div>
      </motion.div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <OnboardingError 
        error={error || 'An unexpected error occurred'}
        errorType={errorType}
        onReturnToLogin={handleReturnToLogin}
      />
    )
  }

  // Success state
  if (step === 'complete' && invitationData) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100 relative overflow-hidden p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-plsom-primary-100/30 via-transparent to-plsom-accent-100/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-plsom-primary-100)_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <OnboardingSuccess 
            invitationData={invitationData}
            onReturnToLogin={handleReturnToLogin}
          />
        </div>
      </motion.div>
    )
  }

  // Main form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100 relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-plsom-primary-100/30 via-transparent to-plsom-accent-100/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-plsom-primary-100)_1px,_transparent_1px)] bg-[length:20px_20px]" />
      </div>
      
      <div className="w-full relative z-10">
        {invitationData && (
          <MultiStepOnboardingForm 
            invitationData={invitationData}
            onComplete={handleOnboardingComplete}
          />
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <OnboardingPageContent />
      </Suspense>
    </main>
  )
}