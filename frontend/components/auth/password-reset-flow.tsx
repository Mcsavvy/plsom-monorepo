'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ForgotPasswordRequest } from './forgot-password-request'
import { OtpVerification } from './otp-verification'

interface PasswordResetFlowProps {
  onSwitchFlow?: (flow: 'login' | 'invitation') => void
}

type ResetStep = 'request' | 'otp' | 'reset' | 'complete' | 'validating'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
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

export default function PasswordResetFlow({ onSwitchFlow }: PasswordResetFlowProps) {
  const [step, setStep] = useState<ResetStep>('request')
  const [contactInfo, setContactInfo] = useState('')
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have a reset token from email link
    const resetToken = searchParams.get('reset')
    if (resetToken) {
      setStep('validating')
      validateResetToken(resetToken)
    }
  }, [searchParams])

  const validateResetToken = async (token: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Validating reset token:', token)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStep('reset')
    } catch {
      setError('Invalid or expired reset link')
      setStep('request')
    }
  }

  const handleOtpSent = (contact: string, method: 'email' | 'phone') => {
    setContactInfo(contact)
    setContactMethod(method)
    setStep('otp')
  }

  const handleOtpVerified = () => {
    setStep('reset')
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStep('complete')
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        // Could potentially use router.push('/login') here instead
        onSwitchFlow?.('login')
      }, 3000)
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Validating reset token
  if (step === 'validating') {
    return (
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
        />
        <motion.h2
          className="text-2xl font-heading font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Validating Reset Link
        </motion.h2>
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Please wait while we verify your reset link...
        </motion.p>
      </motion.div>
    )
  }

  // Completion step
  if (step === 'complete') {
    return (
      <motion.div
        className="text-center space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>
        
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-heading font-bold text-foreground"
        >
          Password Reset Successful
        </motion.h2>
        
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground"
        >
          Your password has been successfully updated. You can now sign in with your new password.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
          />
        </motion.div>
      </motion.div>
    )
  }

  // Password reset form
  if (step === 'reset') {
    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center" variants={itemVariants}>
          <motion.div
            className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <KeyRound className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            Reset Your Password
          </h2>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form onSubmit={handlePasswordReset} className="space-y-4" variants={itemVariants}>
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                placeholder="Enter new password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </motion.div>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-plsom-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Resetting Password...
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>
          </motion.div>
        </motion.form>

        <motion.div className="text-center" variants={itemVariants}>
          <button
            type="button"
            onClick={() => onSwitchFlow?.('login')}
            className="text-primary hover:underline text-sm"
          >
            Remember your password? Sign in
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // Initial request step
  if (step === 'request') {
    return (
      <ForgotPasswordRequest
        onSwitchFlow={onSwitchFlow}
        onOtpSent={handleOtpSent}
      />
    )
  }

  // OTP verification step
  if (step === 'otp') {
    return (
      <OtpVerification
        contactInfo={contactInfo}
        method={contactMethod}
        onVerified={handleOtpVerified}
        onBack={() => setStep('request')}
      />
    )
  }

  return null
}