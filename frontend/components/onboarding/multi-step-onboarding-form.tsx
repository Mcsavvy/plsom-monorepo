'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingWelcome } from './steps/onboarding-welcome'
import { OnboardingSecuritySetup } from './steps/onboarding-security-setup'
import { OnboardingProfileInfo } from './steps/onboarding-profile-info'
import { OnboardingMinistryBackground } from './steps/onboarding-ministry-background'
import { OnboardingCompletion } from './steps/onboarding-completion'
import { OnboardingProgressIndicator } from './onboarding-progress-indicator'

interface InvitationData {
  email: string
  role: string
  program: string
  invitedBy: string
  cohort?: string
  expiresAt: Date
}

interface MultiStepOnboardingFormProps {
  invitationData: InvitationData
  onComplete: () => void
}

type OnboardingStep = 'welcome' | 'security' | 'profile' | 'ministry' | 'completion'

interface OnboardingData {
  // Security
  password: string
  securityQuestions?: Array<{ question: string; answer: string }>
  termsAccepted: boolean
  
  // Profile
  firstName: string
  lastName: string
  phoneNumber: string
  whatsappNumber: string
  dateOfBirth: string
  gender: string
  profilePhoto?: File
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  
  // Ministry & Background
  church: {
    name: string
    pastorName: string
    address: string
    yearsAttended: string
    phone: string
    email: string
  }
  ministry: {
    previousRoles: string[]
    yearsInMinistry: string
    areasOfInterest: string[]
    leadershipExperience: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
    email: string
  }
  education: {
    highestLevel: string
    previousBibleSchool: string
  }
}

const steps: Array<{ id: OnboardingStep; title: string; subtitle: string }> = [
  { id: 'welcome', title: 'Welcome', subtitle: 'Program Confirmation' },
  { id: 'security', title: 'Security', subtitle: 'Account Setup' },
  { id: 'profile', title: 'Profile', subtitle: 'Personal Information' },
  { id: 'ministry', title: 'Ministry', subtitle: 'Background & Experience' },
  { id: 'completion', title: 'Complete', subtitle: 'Review & Finish' }
]

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.3 }
  }
}

export default function MultiStepOnboardingForm({ invitationData, onComplete }: MultiStepOnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    firstName: '',
    lastName: '',
    termsAccepted: false,
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    church: {
      name: '',
      pastorName: '',
      address: '',
      yearsAttended: '',
      phone: '',
      email: ''
    },
    ministry: {
      previousRoles: [],
      yearsInMinistry: '',
      areasOfInterest: [],
      leadershipExperience: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    education: {
      highestLevel: '',
      previousBibleSchool: ''
    }
  })

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep)
  }

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }))
    
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    } else {
      // Final completion
      onComplete()
    }
  }

  const handlePreviousStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const renderCurrentStep = () => {
    const commonProps = {
      invitationData,
      onboardingData,
      onNext: handleStepComplete,
      onPrevious: handlePreviousStep,
      isFirstStep: getCurrentStepIndex() === 0,
      isLastStep: getCurrentStepIndex() === steps.length - 1
    }

    switch (currentStep) {
      case 'welcome':
        return <OnboardingWelcome {...commonProps} />
      case 'security':
        return <OnboardingSecuritySetup {...commonProps} />
      case 'profile':
        return <OnboardingProfileInfo {...commonProps} />
      case 'ministry':
        return <OnboardingMinistryBackground {...commonProps} />
      case 'completion':
        return <OnboardingCompletion {...commonProps} />
      default:
        return null
    }
  }

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Progress Indicator */}
      <OnboardingProgressIndicator 
        steps={steps}
        currentStep={currentStep}
        className="mb-8"
      />

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-[600px]"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
