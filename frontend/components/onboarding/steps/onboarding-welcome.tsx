'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users, Calendar, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLSOMBranding } from '@/components/ui/plsom-branding'

interface InvitationData {
  email: string
  role: string
  program: string
  invitedBy: string
  cohort?: string
  expiresAt: Date
}

interface OnboardingWelcomeProps {
  invitationData: InvitationData
  onNext: (data: Record<string, never>) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const onboardingSteps = [
  {
    step: "Account Security",
    description: "Set up your password and security preferences",
    icon: "🔐"
  },
  {
    step: "Personal Profile", 
    description: "Complete your personal information and contact details",
    icon: "👤"
  },
  {
    step: "Ministry Background",
    description: "Share your church and ministry experience",
    icon: "⛪"
  },
  {
    step: "Final Review",
    description: "Review and confirm all your information",
    icon: "✅"
  }
]

export function OnboardingWelcome({ invitationData, onNext }: OnboardingWelcomeProps) {
  const handleContinue = () => {
    onNext({}) // No data to collect at this step
  }

  return (
    <motion.div
      className="p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Ministry Branding */}
      <motion.div className="text-center mb-8" variants={itemVariants}>
        <div className="mb-6">
          <PLSOMBranding />
        </div>
        
        <motion.h1
          className="text-3xl font-heading font-bold text-foreground mb-4"
          variants={itemVariants}
        >
          Welcome to Your Ministry Journey!
        </motion.h1>
        
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          variants={itemVariants}
        >
          We&apos;re excited to have you join our community of ministry leaders. 
          Let&apos;s get you set up for an amazing learning experience.
        </motion.p>
      </motion.div>

      {/* Program Information */}
      <motion.div className="mb-8" variants={itemVariants}>
        <Card className="bg-gradient-to-br from-plsom-primary-100/10 to-plsom-accent-100/10 border-plsom-primary-100/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-heading text-foreground flex items-center justify-center gap-2">
              <GraduationCap className="w-6 h-6 text-plsom-primary-100" />
              Your Program Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-plsom-primary-100/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-plsom-primary-100/20 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-plsom-primary-100" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-semibold text-foreground">{invitationData.program}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-plsom-primary-100/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-plsom-accent-100/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-plsom-accent-100" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-semibold text-foreground capitalize">{invitationData.role}</p>
                  </div>
                </div>
              </div>

              {invitationData.cohort && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-plsom-primary-100/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cohort</p>
                      <p className="font-semibold text-foreground">{invitationData.cohort}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-plsom-primary-100/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invited By</p>
                    <p className="font-semibold text-foreground">{invitationData.invitedBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Onboarding Steps Preview */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4 text-center">
          What&apos;s Next? Here&apos;s Your Onboarding Journey
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {onboardingSteps.map((step, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-plsom-primary-100/50 transition-colors duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{step.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">{step.step}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
                <div className="text-sm text-plsom-primary-100 font-medium">
                  {index + 2}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div className="text-center" variants={itemVariants}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleContinue}
            size="lg"
            className="btn-plsom-primary px-8 py-3 text-lg"
          >
            Begin My Onboarding Journey
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
        
        <motion.p 
          className="text-sm text-muted-foreground mt-4 max-w-md mx-auto"
          variants={itemVariants}
        >
          This process will take approximately 10-15 minutes to complete. 
          You can save your progress and return at any time.
        </motion.p>
      </motion.div>

      {/* Floating Elements for Visual Appeal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-plsom-primary-100/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
