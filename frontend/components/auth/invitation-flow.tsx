'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InvitationFormData {
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
}

interface InvitationFlowProps {
  onSwitchFlow?: (flow: 'login' | 'password-reset') => void
}

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

export default function InvitationFlow({ onSwitchFlow }: InvitationFlowProps) {
  const [step, setStep] = useState<'validating' | 'setup' | 'complete'>('validating')
  const [formData, setFormData] = useState<InvitationFormData>({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Validate invitation token
    const validateInvitation = async () => {
      const token = searchParams.get('invite')
      if (!token) {
        setError('Invalid invitation link')
        return
      }

      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate invitation validation
        setInvitationData({
          email: 'john.doe@plsom.org',
          role: 'student',
          program: 'Ministry Leadership'
        })
        setStep('setup')
      } catch {
        setError('Invalid or expired invitation link')
      }
    }

    validateInvitation()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
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
        router.push('/student/dashboard')
      }, 3000)
    } catch {
      setError('Failed to complete account setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
          Validating Invitation
        </motion.h2>
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Please wait while we verify your invitation...
        </motion.p>
      </motion.div>
    )
  }

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
          Welcome to PLSOM!
        </motion.h2>
        
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground"
        >
          Your account has been successfully created. You'll be redirected to your dashboard shortly.
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
          <UserPlus className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Complete Your Account
        </h2>
        <p className="text-muted-foreground">
          Welcome to PLSOM! Let's set up your account.
        </p>
        {invitationData && (
          <motion.div
            className="mt-4 p-3 bg-muted rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm">
              <strong>Email:</strong> {invitationData.email}<br />
              <strong>Role:</strong> {invitationData.role}<br />
              <strong>Program:</strong> {invitationData.program}
            </p>
          </motion.div>
        )}
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

      <motion.form onSubmit={handleSubmit} className="space-y-4" variants={itemVariants}>
        <div className="grid grid-cols-2 gap-4">
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="John"
            />
          </motion.div>
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Doe"
            />
          </motion.div>
        </div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              className="pl-10 pr-10"
              placeholder="Create a secure password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="pl-10 pr-10"
              placeholder="Confirm your password"
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
                Setting up account...
              </div>
            ) : (
              'Complete Setup'
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
          Already have an account? Sign in
        </button>
      </motion.div>
    </motion.div>
  )
}