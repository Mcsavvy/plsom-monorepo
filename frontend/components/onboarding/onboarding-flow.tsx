'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import  MultiStepOnboardingForm  from './multi-step-onboarding-form'
import  OnboardingSuccess  from './onboarding-success'
import  OnboardingError  from './onboarding-error'
import { PLSOMBranding } from '@/components/ui/plsom-branding'

type OnboardingStepType = 'validating' | 'form' | 'complete' | 'error'
type OnboardingErrorType = 'invalid_token' | 'expired_token' | 'validation_failed' | 'network_error'

interface InvitationData {
  email: string;
  role: string;
  program: string;
  invitedBy: string;
  expiresAt: Date;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0 
  }
}

export default function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStepType>('validating')
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<OnboardingErrorType>('validation_failed')
  const [windowWidth, setWindowWidth] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Set window width for responsive particles
    setWindowWidth(window.innerWidth)
    
    // Validate invitation token
    const validateInvitation = async () => {
      const token = searchParams.get('token')
      
      // Development bypass - remove this in production
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (!token) {
        if (isDevelopment) {
          // In development, allow access without token for testing
          const mockInvitationData = {
            email: 'dev.user@plsom.org',
            role: 'student',
            program: 'Development Test Program',
            invitedBy: 'Development Admin',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
          setInvitationData(mockInvitationData)
          setStep('form')
          return
        } else {
          setError('No invitation token provided. Please use the complete invitation link from your email.')
          setErrorType('invalid_token')
          setStep('error')
          return
        }
      }

      try {
        // TODO: Replace with actual API call
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate different error scenarios for testing
        if (isDevelopment) {
          // You can uncomment these lines to test different error scenarios:
          // throw new Error('EXPIRED_TOKEN')
          // throw new Error('INVALID_TOKEN') 
          // throw new Error('NETWORK_ERROR')
        }
        
        // TODO: Make actual API call to validate token
        // const response = await fetch(`/api/invitations/validate`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ token })
        // })
        
        // if (!response.ok) {
        //   const errorData = await response.json()
        //   throw new Error(errorData.code || 'VALIDATION_FAILED')
        // }
        
        // const data = await response.json()
        
        // For now, simulate successful validation with mock data
        const mockInvitationData = {
          email: 'john.doe@plsom.org',
          role: 'student', 
          program: 'Certificate Level 2 Practical Ministry',
          invitedBy: 'Dr. Sarah Johnson',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
        
        setInvitationData(mockInvitationData)
        setStep('form')
        
      } catch (error) {
        console.error('Token validation failed:', error)
        
        // Handle specific error types
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

  if (step === 'error') {
    return (
      <OnboardingError 
        error={error || 'An unexpected error occurred'}
        errorType={errorType}
        onReturnToLogin={handleReturnToLogin}
      />
    )
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col lg:flex-row overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Left Side - PLSOM Branding with animated background */}
      <motion.div 
        className="lg:w-1/2 relative overflow-hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-plsom-primary-100 via-plsom-primary-200 to-plsom-accent-100"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * (windowWidth || 800),
                y: Math.random() * 600,
              }}
              animate={{
                y: [null, -20, 20],
                x: [null, Math.random() * 50 - 25],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center h-full p-8">
          <PLSOMBranding />
        </div>
      </motion.div>

      {/* Right Side - Onboarding Forms */}
      <motion.div 
        className="lg:w-1/2 flex items-center justify-center p-8 bg-background relative"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-plsom-primary-100)_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <AnimatePresence mode="wait">
            {step === 'form' && invitationData && (
              <MultiStepOnboardingForm 
                invitationData={invitationData}
                onComplete={handleOnboardingComplete}
              />
            )}
            {step === 'complete' && invitationData && (
              <OnboardingSuccess 
                invitationData={invitationData}
                onReturnToLogin={handleReturnToLogin}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}