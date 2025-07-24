'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Mail, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OnboardingErrorProps {
  error: string
  errorType: 'invalid_token' | 'expired_token' | 'validation_failed' | 'network_error'
  onReturnToLogin: () => void
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

const getErrorDetails = (errorType: OnboardingErrorProps['errorType']) => {
  switch (errorType) {
    case 'invalid_token':
      return {
        title: 'Invalid Invitation Link',
        icon: '🔗',
        description: 'The invitation link you used is not valid or has been corrupted.',
        suggestion: 'Please check that you copied the complete link from your invitation email.'
      }
    case 'expired_token':
      return {
        title: 'Invitation Expired',
        icon: '⏰',
        description: 'This invitation link has expired and is no longer valid.',
        suggestion: 'Invitation links are valid for 7 days from when they were sent.'
      }
    case 'validation_failed':
      return {
        title: 'Validation Failed',
        icon: '❌',
        description: 'Unable to validate your invitation at this time.',
        suggestion: 'This may be a temporary issue. Please try again in a few minutes.'
      }
    case 'network_error':
      return {
        title: 'Connection Error',
        icon: '🌐',
        description: 'Unable to connect to our servers to validate your invitation.',
        suggestion: 'Please check your internet connection and try again.'
      }
    default:
      return {
        title: 'Invitation Error',
        icon: '⚠️',
        description: 'There was an issue with your invitation.',
        suggestion: 'Please contact our support team for assistance.'
      }
  }
}

export default function OnboardingError({ error, errorType, onReturnToLogin }: OnboardingErrorProps) {
  const errorDetails = getErrorDetails(errorType)

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="w-full max-w-md"
        variants={itemVariants}
      >
        <Card className="shadow-2xl border-red-200 dark:border-red-800">
          <CardContent className="p-8 text-center">
            {/* Error Icon */}
            <motion.div
              className="text-6xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                delay: 0.2 
              }}
            >
              {errorDetails.icon}
            </motion.div>

            {/* Error Title */}
            <motion.h2
              className="text-2xl font-heading font-bold text-foreground mb-3"
              variants={itemVariants}
            >
              {errorDetails.title}
            </motion.h2>

            {/* Error Description */}
            <motion.p
              className="text-muted-foreground mb-4"
              variants={itemVariants}
            >
              {errorDetails.description}
            </motion.p>

            {/* Technical Error Message */}
            <motion.div variants={itemVariants}>
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-left">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Suggestion */}
            <motion.div
              className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
              variants={itemVariants}
            >
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Suggestion:</strong> {errorDetails.suggestion}
              </p>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="bg-muted/50 rounded-lg p-4 mb-6"
              variants={itemVariants}
            >
              <h3 className="font-semibold text-foreground mb-3">
                Need Help? Contact Our Admin Team
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>admin@plsom.org</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Please include this error message when contacting support
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="space-y-3"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onReturnToLogin}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Login
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                  variant="secondary"
                >
                  Try Again
                </Button>
              </motion.div>
            </motion.div>

            {/* Footer Note */}
            <motion.p 
              className="text-xs text-muted-foreground mt-6"
              variants={itemVariants}
            >
              If you continue to experience issues, please request a new invitation from your program administrator
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
