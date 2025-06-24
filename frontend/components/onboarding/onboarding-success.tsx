'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { CheckCircle, ArrowRight, BookOpen, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface InvitationData {
  program: string
  role: string
  invitedBy: string
}

interface OnboardingSuccessProps {
  invitationData: InvitationData
  onReturnToLogin: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

const nextSteps = [
  {
    icon: BookOpen,
    title: "Access Your Courses",
    description: "Browse and enroll in your assigned program courses"
  },
  {
    icon: Users,
    title: "Join Your Cohort",
    description: "Connect with fellow students in your study group"
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your academic journey and achievements"
  }
]

export default  function OnboardingSuccess({ invitationData, onReturnToLogin }: OnboardingSuccessProps) {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Set window dimensions on client side
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center" variants={itemVariants}>
        <motion.div
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            delay: 0.2 
          }}
        >
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>
        
        <motion.h2
          className="text-2xl font-heading font-bold text-foreground mb-2"
          variants={itemVariants}
        >
          Welcome to PLSOM!
        </motion.h2>
        
        <motion.p
          className="text-muted-foreground"
          variants={itemVariants}
        >
          Your account has been successfully created. You&apos;re now ready to begin your ministry journey.
        </motion.p>
      </motion.div>

      {/* Program Info */}
      <motion.div variants={itemVariants}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {invitationData.program}
              </h3>
              <p className="text-sm text-muted-foreground">
                Role: {invitationData.role} • Invited by: {invitationData.invitedBy}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Steps */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <h3 className="text-lg font-semibold text-foreground text-center">
          What&apos;s Next?
        </h3>
        
        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div className="space-y-3 pt-4" variants={itemVariants}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onReturnToLogin}
            className="btn-plsom-primary w-full"
          >
            <div className="flex items-center gap-2">
              Continue to Dashboard
              <ArrowRight className="w-4 h-4" />
            </div>
          </Button>
        </motion.div>
        
        <motion.p 
          className="text-xs text-muted-foreground text-center"
          variants={itemVariants}
        >
          You&apos;ll be redirected to the login page where you can sign in with your credentials
        </motion.p>
      </motion.div>

      {/* Celebration Animation */}
      {windowDimensions.width > 0 && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: `linear-gradient(45deg, var(--color-plsom-primary-100), var(--color-plsom-accent-100))`
              }}
              initial={{
                x: windowDimensions.width / 2,
                y: windowDimensions.height / 2,
                scale: 0,
                opacity: 0
              }}
              animate={{
                x: Math.random() * windowDimensions.width,
                y: Math.random() * windowDimensions.height,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360]
              }}
              transition={{
                duration: 3,
                delay: i * 0.15,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Additional confetti burst */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"
              initial={{
                x: windowDimensions.width / 2,
                y: windowDimensions.height / 2,
                rotate: 0,
                scale: 0
              }}
              animate={{
                x: windowDimensions.width / 2 + (Math.random() - 0.5) * 400,
                y: windowDimensions.height / 2 + (Math.random() - 0.5) * 400,
                rotate: Math.random() * 720,
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                delay: 0.5 + i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}